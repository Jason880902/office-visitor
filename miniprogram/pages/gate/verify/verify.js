// pages/gate/verify/verify.js
Page({
	data: {
		loading: true,
		result: null,
		detail: null
	},

	onLoad(options) {
		// 从小程序码scene参数获取访客ID
		const scene = decodeURIComponent(options.scene || '');
		let visitorId = '';

		if (scene.includes('v=')) {
			visitorId = scene.split('v=')[1];
		} else if (options.id) {
			visitorId = options.id;
		}

		if (visitorId) {
			this.verifyVisitor(visitorId);
		} else {
			this.setData({
				loading: false,
				result: {
					success: false,
					message: '无效的通行码'
				}
			});
		}
	},

	async verifyVisitor(visitorId) {
		try {
			// 先查看预约详情
			const detailRes = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/detail',
					id: visitorId
				}
			});

			if (detailRes.result.code === 0) {
				const detail = detailRes.result.data;
				const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
				detail.statusText = STATUS_TEXT[detail.status] || '未知';
				this.setData({ detail });
			}

			// 执行核验
			const verifyRes = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'gate/verify',
					visitorId
				}
			});

			if (verifyRes.result.code === 0) {
				const data = verifyRes.result.data;
				const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };

				if (data.status === 1) {
					this.setData({
						loading: false,
						result: {
							success: true,
							visitorName: data.visitorName,
							visitorCompany: data.visitorCompany,
							hostName: data.hostName,
							hostFloor: data.hostFloor,
							visitDate: data.visitDate
						}
					});
				} else {
					this.setData({
						loading: false,
						result: {
							success: false,
							message: `当前状态: ${STATUS_TEXT[data.status]}，无法通行`
						}
					});
				}
			} else {
				this.setData({
					loading: false,
					result: {
						success: false,
						message: verifyRes.result.msg || '核验失败'
					}
				});
			}
		} catch (err) {
			console.error('核验失败:', err);
			this.setData({
				loading: false,
				result: {
					success: false,
					message: '网络错误，请重试'
				}
			});
		}
	},

	onBack() {
		wx.reLaunch({ url: '/pages/index/index' });
	}
});
