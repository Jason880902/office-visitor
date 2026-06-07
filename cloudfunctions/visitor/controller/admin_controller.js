/**
 * 管理后台控制器
 */
const cloud = require('wx-server-sdk');
const { VisitorModel, STATUS } = require('../model/visitor_model');
const { UserModel, ROLE } = require('../model/user_model');
const { GateModel } = require('../model/gate_model');

const db = cloud.database();
const _ = db.command;

class AdminController {
	constructor(event, context) {
		this.event = event;
		this.context = context;
		this.openId = cloud.getWXContext().OPENID;
	}

	/**
	 * 验证管理员权限
	 */
	async _checkAdmin() {
		const user = await UserModel.getByOpenId(this.openId);
		if (!user || user.role !== ROLE.ADMIN) {
			throw new Error('无管理员权限');
		}
		return user;
	}

	/**
	 * 仪表盘数据
	 */
	async dashboard() {
		await this._checkAdmin();

		const today = new Date().toISOString().split('T')[0];

		// 今日预约数
		const todayCount = await db.collection('visitors')
			.where({
				visitDate: today,
				status: _.in([STATUS.APPROVED, STATUS.VISITED])
			})
			.count();

		// 待审批数
		const pendingCount = await db.collection('visitors')
			.where({ status: STATUS.PENDING })
			.count();

		// 今日已来访数
		const visitedCount = await db.collection('visitors')
			.where({
				visitDate: today,
				status: STATUS.VISITED
			})
			.count();

		// 总预约数
		const totalCount = await db.collection('visitors').count();

		return {
			todayCount: todayCount.total,
			pendingCount: pendingCount.total,
			visitedCount: visitedCount.total,
			totalCount: totalCount.total
		};
	}

	/**
	 * 访客列表
	 */
	async visitorList() {
		const { page = 1, size = 20, status, keyword, startDate, endDate } = this.event;

		await this._checkAdmin();

		let where = {};
		if (status !== undefined && status !== '') where.status = Number(status);
		if (startDate && endDate) {
			where.visitDate = _.gte(startDate).and(_.lte(endDate));
		}
		if (keyword) {
			where = _.or([
				{ visitorName: db.RegExp({ regexp: keyword, options: 'i' }) },
				{ visitorPhone: db.RegExp({ regexp: keyword, options: 'i' }) },
				{ hostName: db.RegExp({ regexp: keyword, options: 'i' }) },
				{ orderNo: db.RegExp({ regexp: keyword, options: 'i' }) }
			]);
		}

		return await VisitorModel.getAll(where, page, size);
	}

	/**
	 * 导出数据
	 */
	async exportData() {
		const { startDate, endDate, status } = this.event;

		await this._checkAdmin();

		let where = {};
		if (status !== undefined && status !== '') where.status = Number(status);
		if (startDate && endDate) {
			where.visitDate = _.gte(startDate).and(_.lte(endDate));
		}

		// 获取所有符合条件的数据
		const result = await VisitorModel.getAll(where, 1, 1000);

		// 生成CSV内容
		const headers = ['预约编号', '访客姓名', '访客手机', '访客公司', '来访日期', '来访时间', '被访人', '被访楼层', '状态', '提交时间'];
		const rows = result.list.map(item => [
			item.orderNo,
			item.visitorName,
			item.visitorPhone,
			item.visitorCompany,
			item.visitDate,
			item.visitTime,
			item.hostName,
			item.hostFloor,
			STATUS[item.status],
			item.createTime
		]);

		const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

		// 上传到云存储
		const uploadResult = await cloud.uploadFile({
			cloudPath: `exports/visitor_${Date.now()}.csv`,
			fileContent: Buffer.from('﻿' + csvContent, 'utf-8') // 添加BOM支持中文
		});

		return { fileID: uploadResult.fileID };
	}

	/**
	 * 门禁设备列表
	 */
	async gateDevices() {
		await this._checkAdmin();
		return await GateModel.getDevices();
	}

	/**
	 * 添加门禁设备
	 */
	async addDevice() {
		const { deviceCode, deviceName, location, brand, apiUrl } = this.event;

		await this._checkAdmin();

		if (!deviceCode || !deviceName) {
			throw new Error('请填写设备编码和名称');
		}

		// 检查编码是否重复
		const existing = await GateModel.getByCode(deviceCode);
		if (existing) {
			throw new Error('设备编码已存在');
		}

		const deviceId = await GateModel.addDevice({
			deviceCode,
			deviceName,
			location: location || '',
			brand: brand || 'generic',
			apiUrl: apiUrl || ''
		});

		return { deviceId };
	}
}

module.exports = AdminController;
