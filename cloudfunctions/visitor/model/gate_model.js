/**
 * 门禁设备数据模型
 */
const cloud = require('wx-server-sdk');
const db = cloud.database();

const COLLECTION = 'gate_devices';
const RECORD_COLLECTION = 'gate_records';

// 设备状态
const DEVICE_STATUS = {
	OFFLINE: 0,
	ONLINE: 1,
	MAINTENANCE: 2
};

class GateModel {
	/**
	 * 添加门禁设备
	 */
	static async addDevice(data) {
		const result = await db.collection(COLLECTION).add({
			data: {
				...data,
				status: DEVICE_STATUS.ONLINE,
				createTime: db.serverDate(),
				updateTime: db.serverDate()
			}
		});
		return result._id;
	}

	/**
	 * 获取设备列表
	 */
	static async getDevices(where = {}) {
		const result = await db.collection(COLLECTION)
			.where(where)
			.orderBy('createTime', 'desc')
			.get();
		return result.data;
	}

	/**
	 * 根据设备编码获取设备
	 */
	static async getByCode(deviceCode) {
		const result = await db.collection(COLLECTION)
			.where({ deviceCode })
			.get();
		return result.data[0] || null;
	}

	/**
	 * 更新设备状态
	 */
	static async updateStatus(id, status) {
		await db.collection(COLLECTION).doc(id).update({
			data: { status, updateTime: db.serverDate() }
		});
	}

	/**
	 * 记录通行记录
	 */
	static async addRecord(data) {
		const result = await db.collection(RECORD_COLLECTION).add({
			data: {
				...data,
				createTime: db.serverDate()
			}
		});
		return result._id;
	}

	/**
	 * 获取通行记录
	 */
	static async getRecords(where = {}, page = 1, size = 20) {
		const countResult = await db.collection(RECORD_COLLECTION)
			.where(where)
			.count();
		const total = countResult.total;

		const list = await db.collection(RECORD_COLLECTION)
			.where(where)
			.orderBy('createTime', 'desc')
			.skip((page - 1) * size)
			.limit(size)
			.get();

		return { list: list.data, total };
	}
}

module.exports = { GateModel, DEVICE_STATUS };
