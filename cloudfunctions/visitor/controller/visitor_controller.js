/**
 * 访客预约控制器
 */
const cloud = require('wx-server-sdk');
const { VisitorModel, STATUS } = require('../model/visitor_model');
const { UserModel } = require('../model/user_model');

class VisitorController {
	constructor(event, context) {
		this.event = event;
		this.context = context;
		this.openId = cloud.getWXContext().OPENID;
	}

	/**
	 * 提交预约申请
	 */
	async apply() {
		const {
			visitorName,
			visitorPhone,
			visitorCompany,
			visitReason,
			visitDate,
			visitTime,
			hostName,
			hostPhone,
			hostCompany,
			hostFloor,
			carNumber,
			remark
		} = this.event;

		// 参数校验
		if (!visitorName || !visitorPhone || !visitDate || !hostName || !hostPhone) {
			throw new Error('请填写完整的预约信息');
		}

		const user = await UserModel.getByOpenId(this.openId);
		if (!user) throw new Error('请先登录');

		// 生成预约编号
		const orderNo = 'VIS' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

		const visitorId = await VisitorModel.create({
			orderNo,
			userId: user._id,
			userOpenId: this.openId,
			visitorName,
			visitorPhone,
			visitorCompany: visitorCompany || '',
			visitReason,
			visitDate,
			visitTime,
			hostName,
			hostPhone,
			hostCompany: hostCompany || '',
			hostFloor: hostFloor || '',
			carNumber: carNumber || '',
			remark: remark || '',
			qrcodeExpireTime: new Date(`${visitDate} ${visitTime || '18:00'}`).getTime() + 24 * 60 * 60 * 1000
		});

		// 发送订阅消息给审批人（如果有指定）
		// TODO: 发送消息通知

		return { visitorId, orderNo };
	}

	/**
	 * 我的预约列表
	 */
	async myList() {
		const { page = 1, size = 10 } = this.event;

		const user = await UserModel.getByOpenId(this.openId);
		if (!user) throw new Error('请先登录');

		return await VisitorModel.getByUserId(user._id, page, size);
	}

	/**
	 * 预约详情
	 */
	async detail() {
		const { id } = this.event;
		if (!id) throw new Error('参数错误');

		const visitor = await VisitorModel.getById(id);
		if (!visitor) throw new Error('预约记录不存在');

		return visitor;
	}

	/**
	 * 取消预约
	 */
	async cancel() {
		const { id } = this.event;
		if (!id) throw new Error('参数错误');

		const visitor = await VisitorModel.getById(id);
		if (!visitor) throw new Error('预约记录不存在');

		if (visitor.userOpenId !== this.openId) {
			throw new Error('无权操作');
		}

		if (visitor.status !== STATUS.PENDING && visitor.status !== STATUS.APPROVED) {
			throw new Error('当前状态无法取消');
		}

		await VisitorModel.updateStatus(id, STATUS.CANCELLED);
		return { success: true };
	}

	/**
	 * 获取通行二维码
	 */
	async getQrcode() {
		const { id } = this.event;
		if (!id) throw new Error('参数错误');

		const visitor = await VisitorModel.getById(id);
		if (!visitor) throw new Error('预约记录不存在');

		if (visitor.status !== STATUS.APPROVED) {
			throw new Error('预约未通过审批，无法生成通行码');
		}

		// 检查是否过期
		if (visitor.qrcodeExpireTime < Date.now()) {
			await VisitorModel.updateStatus(id, STATUS.EXPIRED);
			throw new Error('预约已过期');
		}

		// 生成小程序码
		try {
			const result = await cloud.openapi.wxacode.getUnlimited({
				scene: `v=${id}`,
				page: 'pages/gate/verify/verify',
				width: 280
			});

			// 上传到云存储
			const uploadResult = await cloud.uploadFile({
				cloudPath: `qrcodes/${id}.jpg`,
				fileContent: result.buffer
			});

			// 更新记录
			await VisitorModel.updateStatus(id, visitor.status, {
				qrcodeFileID: uploadResult.fileID
			});

			return { qrcodeUrl: uploadResult.fileID };
		} catch (err) {
			console.error('生成二维码失败，详细错误:', JSON.stringify(err, null, 2));
			// 如果生成二维码失败，直接返回预约ID，让用户手动输入
			return {
				qrcodeUrl: '',
				visitorId: id,
				fallback: true,
				errorMsg: err.message || '生成二维码失败，请使用预约ID核验'
			};
		}
	}
}

module.exports = VisitorController;
