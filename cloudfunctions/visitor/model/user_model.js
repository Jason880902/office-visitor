/**
 * 用户数据模型
 */
const cloud = require('wx-server-sdk');
const db = cloud.database();

const COLLECTION = 'users';

// 用户角色
const ROLE = {
	VISITOR: 0,      // 普通用户/访客
	APPROVER: 1,     // 审批人
	GATEKEEPER: 2,   // 门卫/核验员
	ADMIN: 3         // 管理员
};

const ROLE_TEXT = {
	[ROLE.VISITOR]: '访客',
	[ROLE.APPROVER]: '审批人',
	[ROLE.GATEKEEPER]: '核验员',
	[ROLE.ADMIN]: '管理员'
};

class UserModel {
	/**
	 * 创建或更新用户
	 */
	static async upsertByOpenId(openId, data) {
		const existing = await db.collection(COLLECTION)
			.where({ openId })
			.get();

		if (existing.data.length > 0) {
			await db.collection(COLLECTION).doc(existing.data[0]._id).update({
				data: { ...data, updateTime: db.serverDate() }
			});
			return existing.data[0]._id;
		} else {
			const result = await db.collection(COLLECTION).add({
				data: {
					openId,
					...data,
					role: ROLE.VISITOR,
					createTime: db.serverDate(),
					updateTime: db.serverDate()
				}
			});
			return result._id;
		}
	}

	/**
	 * 根据openId获取用户
	 */
	static async getByOpenId(openId) {
		const result = await db.collection(COLLECTION)
			.where({ openId })
			.get();
		return result.data[0] || null;
	}

	/**
	 * 根据ID获取用户
	 */
	static async getById(id) {
		const result = await db.collection(COLLECTION).doc(id).get();
		return result.data;
	}

	/**
	 * 更新用户信息
	 */
	static async update(id, data) {
		await db.collection(COLLECTION).doc(id).update({
			data: { ...data, updateTime: db.serverDate() }
		});
	}

	/**
	 * 获取用户列表（管理后台）
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

module.exports = { UserModel, ROLE, ROLE_TEXT };
