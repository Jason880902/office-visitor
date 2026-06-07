// pages/approve/detail/detail.js
const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝' };
const STATUS_DESC = {
	0: '请审核此访客预约申请',
	1: '预约已通过',
	2: '预约已拒绝'
};

Page({
	data: {
		id: '',
		detail: {},
		statusText: '',
		statusClass: '',
		statusDesc: ''
	},

	onLoad(options) {
		if (options.id) {
			this.setData({ id: options.id });
			this.loadDetail();
		}
	},

	async loadDetail() {
		wx.showLoading({ title: '加载中...' });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'approve/detail',
					id: this.data.id
				}
			});

			if (res.result.code === 0) {
				const detail = res.result.data;
				const statusClass = { 0: 'pending', 1: 'approved', 2: 'rejected' };
				this.setData({
					detail,
					statusText: STATUS_TEXT[detail.status] || '未知',
					statusClass: statusClass[detail.status] || '',
					statusDesc: STATUS_DESC[detail.status] || ''
				});
			}
		} catch (err) {
			console.error('加载详情失败:', err);
			wx.showToast({ title: '加载失败', icon: 'none' });
		} finally {
			wx.hideLoading();
		}
	},

	async onPass() {
		wx.showModal({
			title: '确认通过',
			content: '确定通过此访客预约吗？',
			success: async (res) => {
				if (res.confirm) {
					try {
						const result = await wx.cloud.callFunction({
							name: 'visitor',
							data: {
								route: 'approve/pass',
								id: this.data.id
							}
						});

						if (result.result.code === 0) {
							wx.showToast({ title: '已通过', icon: 'success' });
							setTimeout(() => wx.navigateBack(), 1500);
						} else {
							wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' });
						}
					} catch (err) {
						wx.showToast({ title: '操作失败', icon: 'none' });
					}
				}
			}
		});
	},

	async onReject() {
		wx.showModal({
			title: '拒绝预约',
			editable: true,
			placeholderText: '请输入拒绝原因',
			success: async (res) => {
				if (res.confirm) {
					const reason = res.content;
					if (!reason) {
						wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
						return;
					}

					try {
						const result = await wx.cloud.callFunction({
							name: 'visitor',
							data: {
								route: 'approve/reject',
								id: this.data.id,
								reason
							}
						});

						if (result.result.code === 0) {
							wx.showToast({ title: '已拒绝', icon: 'success' });
							setTimeout(() => wx.navigateBack(), 1500);
						} else {
							wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' });
						}
					} catch (err) {
						wx.showToast({ title: '操作失败', icon: 'none' });
					}
				}
			}
		});
	},

	callPhone(e) {
		const phone = e.currentTarget.dataset.phone;
		if (phone) wx.makePhoneCall({ phoneNumber: phone });
	}
});
