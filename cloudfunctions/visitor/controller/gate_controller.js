/**
 * 门禁核验控制器
 */
const cloud = require('wx-server-sdk');
const { VisitorModel, STATUS } = require('../model/visitor_model');
const { GateModel } = require('../model/gate_model');
const { UserModel, ROLE } = require('../model/user_model');

class GateController {
	constructor(event, context) {
		this.event = event;
		this.context = context;
		this.openId = cloud.getWXContext().OPENID;
	}

	/**
	 * 验证是否为门卫
	 */
	async _checkGatekeeper() {
		const user = await UserModel.getByOpenId(this.openId);
		if (!user || (user.role !== ROLE.GATEKEEPER && user.role !== ROLE.ADMIN)) {
			throw new Error('无核验权限');
		}
		return user;
	}

	/**
	 * 扫码核验
	 */
	async scan() {
		const { visitorId, deviceCode } = this.event;
		if (!visitorId) throw new Error('无效的通行码');

		const user = await this._checkGatekeeper();

		const visitor = await VisitorModel.getById(visitorId);
		if (!visitor) {
			await this._recordAccess(deviceCode, null, 'fail', '预约记录不存在');
			throw new Error('预约记录不存在');
		}

		// 检查状态
		if (visitor.status !== STATUS.APPROVED) {
			const statusText = STATUS[visitor.status] || '未知状态';
			await this._recordAccess(deviceCode, visitor, 'fail', statusText);
			throw new Error(`当前状态: ${statusText}，无法通行`);
		}

		// 检查是否过期
		if (visitor.qrcodeExpireTime < Date.now()) {
			await VisitorModel.updateStatus(visitorId, STATUS.EXPIRED);
			await this._recordAccess(deviceCode, visitor, 'fail', '通行码已过期');
			throw new Error('通行码已过期');
		}

		// 检查日期
		const today = new Date().toISOString().split('T')[0];
		if (visitor.visitDate !== today) {
			await this._recordAccess(deviceCode, visitor, 'fail', '不在预约日期');
			throw new Error(`预约日期为 ${visitor.visitDate}，今天无法使用`);
		}

		// 核验通过
		await VisitorModel.updateStatus(visitorId, STATUS.VISITED, {
			visitTime: db.serverDate(),
			gatekeeperId: user._id,
			gatekeeperName: user.nickName
		});

		await this._recordAccess(deviceCode, visitor, 'success', '核验通过');

		// 触发门禁开门（通过设备API）
		await this._triggerGate(deviceCode);

		return {
			success: true,
			visitorName: visitor.visitorName,
			visitorCompany: visitor.visitorCompany,
			hostName: visitor.hostName,
			hostFloor: visitor.hostFloor
		};
	}

	/**
	 * 验证通行码（查看详情用）
	 */
	async verify() {
		const { visitorId } = this.event;
		if (!visitorId) throw new Error('无效的通行码');

		const visitor = await VisitorModel.getById(visitorId);
		if (!visitor) throw new Error('预约记录不存在');

		return {
			orderNo: visitor.orderNo,
			visitorName: visitor.visitorName,
			visitorPhone: visitor.visitorPhone,
			visitorCompany: visitor.visitorCompany,
			visitDate: visitor.visitDate,
			visitTime: visitor.visitTime,
			hostName: visitor.hostName,
			hostFloor: visitor.hostFloor,
			status: visitor.status,
			statusText: STATUS[visitor.status]
		};
	}

	/**
	 * 获取通行记录
	 */
	async record() {
		const { page = 1, size = 20, deviceCode, date } = this.event;

		await this._checkGatekeeper();

		let where = {};
		if (deviceCode) where.deviceCode = deviceCode;
		if (date) where.visitDate = date;

		return await GateModel.getRecords(where, page, size);
	}

	/**
	 * 记录通行日志
	 */
	async _recordAccess(deviceCode, visitor, result, message) {
		await GateModel.addRecord({
			deviceCode,
			visitorId: visitor?._id,
			visitorName: visitor?.visitorName,
			visitorPhone: visitor?.visitorPhone,
			hostName: visitor?.hostName,
			hostFloor: visitor?.hostFloor,
			result,
			message,
			operatorOpenId: this.openId
		});
	}

	/**
	 * 触发门禁开门
	 * 这里对接具体的门禁硬件API
	 */
	async _triggerGate(deviceCode) {
		const device = await GateModel.getByCode(deviceCode);
		if (!device) {
			console.warn('设备不存在:', deviceCode);
			return;
		}

		// 根据设备类型调用不同的门禁API
		switch (device.brand) {
			case 'hikvision':
				// 海康威视门禁API
				await this._callHikvisionAPI(device);
				break;
			case 'dahua':
				// 大华门禁API
				await this._callDahuaAPI(device);
				break;
			case 'generic':
				// 通用HTTP接口
				await this._callGenericAPI(device);
				break;
			default:
				console.warn('不支持的设备品牌:', device.brand);
		}
	}

	/**
	 * 海康威视门禁API调用
	 */
	async _callHikvisionAPI(device) {
		// TODO: 对接海康威视ISAPI接口
		// 示例: POST http://device-ip/ISAPI/AccessControl/RemoteControl/door/1
		console.log('触发海康威视门禁:', device.deviceCode);
	}

	/**
	 * 大华门禁API调用
	 */
	async _callDahuaAPI(device) {
		// TODO: 对接大华门禁接口
		console.log('触发大华门禁:', device.deviceCode);
	}

	/**
	 * 通用HTTP接口调用
	 */
	async _callGenericAPI(device) {
		// TODO: 调用通用HTTP接口开门
		// 示例: POST http://device-ip/open
		console.log('触发通用门禁:', device.deviceCode);
	}
}

const db = cloud.database();
module.exports = GateController;
