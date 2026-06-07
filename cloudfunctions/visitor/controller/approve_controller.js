/**
 * 审批控制器
 */
const cloud = require('wx-server-sdk');
const { VisitorModel, STATUS } = require('../model/visitor_model');
const { UserModel, ROLE } = require('../model/user_model');

class ApproveController {
	constructor(event, context) {
		this.event = event;
		this.context = context;
		this.openId = cloud.getWXContext().OPENID;
	}

	/**
	 * 验证是否为审批人
	 */
	async _checkApprover() {
		const user = await UserModel.getByOpenId(this.openId);
		if (!user || (user.role !== ROLE.APPROVER && user.role !== ROLE.ADMIN)) {
			throw new Error('无审批权限');
		}
		return user;
	}

	/**
	 * 获取待审批列表
	 */
	async list() {
		const { page = 1, size = 10, status } = this.event;

		const user = await this._checkApprover();

		let where = {};
		if (status !== undefined && status !== '') {
			where.status = Number(status);
		} else {
			where.status = STATUS.PENDING;
		}

		// 如果是楼层审批人，只看自己负责的楼层
		if (user.approveFloor) {
			where.hostFloor = user.approveFloor;
		}

		return await VisitorModel.getAll(where, page, size);
	}

	/**
	 * 获取审批详情
	 */
	async detail() {
		const { id } = this.event;
		if (!id) throw new Error('参数错误');

		await this._checkApprover();
		return await VisitorModel.getById(id);
	}

	/**
	 * 审批通过
	 */
	async pass() {
		const { id, remark } = this.event;
		if (!id) throw new Error('参数错误');

		const user = await this._checkApprover();
		const visitor = await VisitorModel.getById(id);

		if (!visitor) throw new Error('预约记录不存在');
		if (visitor.status !== STATUS.PENDING) {
			throw new Error('该预约已被处理');
		}

		await VisitorModel.updateStatus(id, STATUS.APPROVED, {
			approverId: user._id,
			approverName: user.nickName,
			approveTime: db.serverDate(),
			approveRemark: remark || ''
		});

		// 发送订阅消息通知访客
		try {
			await cloud.openapi.subscribeMessage.send({
				touser: visitor.userOpenId,
				templateId: 'your-template-id', // 需要替换为实际的模板ID
				page: 'pages/visitor/detail/detail',
				data: {
					thing1: { value: '预约审批通过' },
					thing2: { value: visitor.visitorName },
					date3: { value: visitor.visitDate },
					thing4: { value: '请在预约时间到达，出示通行码进入' }
				}
			});
		} catch (err) {
			console.error('发送消息失败:', err);
		}

		return { success: true };
	}

	/**
	 * 审批拒绝
	 */
	async reject() {
		const { id, reason } = this.event;
		if (!id || !reason) throw new Error('请填写拒绝原因');

		const user = await this._checkApprover();
		const visitor = await VisitorModel.getById(id);

		if (!visitor) throw new Error('预约记录不存在');
		if (visitor.status !== STATUS.PENDING) {
			throw new Error('该预约已被处理');
		}

		await VisitorModel.updateStatus(id, STATUS.REJECTED, {
			approverId: user._id,
			approverName: user.nickName,
			approveTime: db.serverDate(),
			rejectReason: reason
		});

		// 发送订阅消息通知访客
		try {
			await cloud.openapi.subscribeMessage.send({
				touser: visitor.userOpenId,
				templateId: 'your-template-id',
				page: 'pages/visitor/detail/detail',
				data: {
					thing1: { value: '预约审批未通过' },
					thing2: { value: visitor.visitorName },
					thing5: { value: reason }
				}
			});
		} catch (err) {
			console.error('发送消息失败:', err);
		}

		return { success: true };
	}
}

const db = cloud.database();
module.exports = ApproveController;
