/**
 * 访客预约数据模型
 */
const cloud = require('wx-server-sdk');
const db = cloud.database();

const COLLECTION = 'visitors';

// 预约状态
const STATUS = {
	PENDING: 0,      // 待审批
	APPROVED: 1,     // 已通过
	REJECTED: 2,     // 已拒绝
	CANCELLED: 3,    // 已取消
	EXPIRED: 4,      // 已过期
	VISITED: 5       // 已来访
};

const STATUS_TEXT = {
	[STATUS.PENDING]: '待审批',
	[STATUS.APPROVED]: '已通过',
	[STATUS.REJECTED]: '已拒绝',
	[STATUS.CANCELLED]: '已取消',
	[STATUS.EXPIRED]: '已过期',
	[STATUS.VISITED]: '已来访'
};

class VisitorModel {
	/**
	 * 创建预约
	 */
	static async create(data) {
		const result = await db.collection(COLLECTION).add({
			data: {
				...data,
				status: STATUS.PENDING,
				createTime: db.serverDate(),
				updateTime: db.serverDate()
			}
		});
		return result._id;
	}

	/**
	 * 获取预约详情
	 */
	static async getById(id) {
		const result = await db.collection(COLLECTION).doc(id).get();
		return result.data;
	}

	/**
	 * 获取用户的预约列表
	 */
	static async getByUserId(userId, page = 1, size = 10) {
		const countResult = await db.collection(COLLECTION)
			.where({ userId })
			.count();
		const total = countResult.total;

		const list = await db.collection(COLLECTION)
			.where({ userId })
			.orderBy('createTime', 'desc')
			.skip((page - 1) * size)
			.limit(size)
			.get();

		return { list: list.data, total };
	}

	/**
	 * 获取待审批列表（审批人）
	 */
	static async getPendingList(approverId, page = 1, size = 10) {
		const where = {
			status: STATUS.PENDING,
			approverId
		};

		const countResult = await db.collection(COLLECTION)
			.where(where)
			.count();
		const total = countResult.total;

		const list = await db.collection(COLLECTION)
			.where(where)
			.orderBy('createTime', 'desc')
			.skip((page - 1) * size)
			.limit(size)
			.get();

		return { list: list.data, total };
	}

	/**
	 * 更新预约状态
	 */
	static async updateStatus(id, status, extraData = {}) {
		await db.collection(COLLECTION).doc(id).update({
			data: {
				status,
				...extraData,
				updateTime: db.serverDate()
			}
		});
	}

	/**
	 * 获取所有预约（管理后台）
	 */
	static async getAll(where = {}, page = 1, size = 20) {
		const countResult = await db.collection(COLLECTION)
			.where(where)
			.count();
		const total = countResult.total;

		const list = await db.collection(COLLECTION)
			.where(where)
			.orderBy('createTime', 'desc')
			.skip((page - 1) * size)
			.limit(size)
			.get();

		return { list: list.data, total };
	}
}

module.exports = { VisitorModel, STATUS, STATUS_TEXT };
