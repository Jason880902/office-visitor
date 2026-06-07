// pages/approve/list/list.js
const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
const STATUS_CLASS = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'visited' };

Page({
	data: {
		list: [],
		currentStatus: 0,
		page: 1,
		hasMore: true,
		loading: false
	},

	onLoad() {
		this.loadList();
	},

	onShow() {
		this.refreshList();
	},

	onPullDownRefresh() {
		this.refreshList();
	},

	refreshList() {
		this.setData({ page: 1, hasMore: true });
		this.loadList();
	},

	async loadList() {
		if (this.data.loading) return;
		this.setData({ loading: true });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'approve/list',
					page: this.data.page,
					size: 10,
					status: this.data.currentStatus
				}
			});

			if (res.result.code === 0) {
				const { list, total } = res.result.data;
				const formattedList = list.map(item => ({
					...item,
					statusText: STATUS_TEXT[item.status] || '未知',
					statusClass: STATUS_CLASS[item.status] || ''
				}));

				this.setData({
					list: this.data.page === 1 ? formattedList : [...this.data.list, ...formattedList],
					hasMore: this.data.list.length < total
				});
			}
		} catch (err) {
			console.error('加载列表失败:', err);
			wx.showToast({ title: '加载失败', icon: 'none' });
		} finally {
			this.setData({ loading: false });
			wx.stopPullDownRefresh();
		}
	},

	loadMore() {
		this.setData({ page: this.data.page + 1 });
		this.loadList();
	},

	onFilter(e) {
		const status = Number(e.currentTarget.dataset.status);
		this.setData({ currentStatus: status, page: 1 });
		this.loadList();
	},

	goDetail(e) {
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: `/pages/approve/detail/detail?id=${id}` });
	},

	async onPass(e) {
		const id = e.currentTarget.dataset.id;

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
								id
							}
						});

						if (result.result.code === 0) {
							wx.showToast({ title: '已通过', icon: 'success' });
							this.refreshList();
						} else {
							wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' });
						}
					} catch (err) {
						console.error('审批失败:', err);
						wx.showToast({ title: '操作失败', icon: 'none' });
					}
				}
			}
		});
	},

	async onReject(e) {
		const id = e.currentTarget.dataset.id;

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
								id,
								reason
							}
						});

						if (result.result.code === 0) {
							wx.showToast({ title: '已拒绝', icon: 'success' });
							this.refreshList();
						} else {
							wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' });
						}
					} catch (err) {
						console.error('审批失败:', err);
						wx.showToast({ title: '操作失败', icon: 'none' });
					}
				}
			}
		});
	}
});
