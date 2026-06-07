// pages/visitor/detail/detail.js
const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
const STATUS_CLASS = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'visited' };
const STATUS_DESC = {
	0: '您的预约正在等待审批，请耐心等待',
	1: '预约已通过，请在预约时间到达时出示通行码',
	2: '预约未通过，请查看拒绝原因或重新预约',
	3: '预约已取消',
	4: '预约已过期',
	5: '已完成来访'
};

Page({
	data: {
		id: '',
		detail: {},
		statusText: '',
		statusClass: '',
		statusDesc: '',
		qrcodeUrl: ''
	},

	onLoad(options) {
		if (options.id) {
			this.setData({ id: options.id });
			this.loadDetail();
		}
	},

	// 加载详情
	async loadDetail() {
		wx.showLoading({ title: '加载中...' });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/detail',
					id: this.data.id
				}
			});

			if (res.result.code === 0) {
				const detail = res.result.data;
				this.setData({
					detail,
					statusText: STATUS_TEXT[detail.status] || '未知',
					statusClass: STATUS_CLASS[detail.status] || '',
					statusDesc: STATUS_DESC[detail.status] || '',
					qrcodeUrl: detail.qrcodeFileID || ''
				});
			} else {
				wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
			}
		} catch (err) {
			console.error('加载详情失败:', err);
			wx.showToast({ title: '加载失败', icon: 'none' });
		} finally {
			wx.hideLoading();
		}
	},

	// 获取通行码
	async onGetQrcode() {
		wx.showLoading({ title: '生成中...' });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/getQrcode',
					id: this.data.id
				}
			});

			if (res.result.code === 0) {
				this.setData({ qrcodeUrl: res.result.data.qrcodeUrl });
			} else {
				wx.showToast({ title: res.result.msg || '生成失败', icon: 'none' });
			}
		} catch (err) {
			console.error('获取通行码失败:', err);
			wx.showToast({ title: '生成失败', icon: 'none' });
		} finally {
			wx.hideLoading();
		}
	},

	// 取消预约
	onCancel() {
		wx.showModal({
			title: '确认取消',
			content: '确定要取消此预约吗？',
			success: async (res) => {
				if (res.confirm) {
					try {
						const result = await wx.cloud.callFunction({
							name: 'visitor',
							data: {
								route: 'visitor/cancel',
								id: this.data.id
							}
						});

						if (result.result.code === 0) {
							wx.showToast({ title: '已取消', icon: 'success' });
							this.loadDetail();
						} else {
							wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' });
						}
					} catch (err) {
						console.error('取消失败:', err);
						wx.showToast({ title: '取消失败', icon: 'none' });
					}
				}
			}
		});
	},

	// 拨打电话
	callPhone(e) {
		const phone = e.currentTarget.dataset.phone;
		if (phone) {
			wx.makePhoneCall({ phoneNumber: phone });
		}
	}
});
