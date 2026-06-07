// pages/admin/visitors/visitors.js
const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
const STATUS_CLASS = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'visited' };

Page({
	data: {
		list: [],
		keyword: '',
		currentStatus: -1,
		page: 1,
		hasMore: true,
		loading: false
	},

	onLoad(options) {
		if (options.date) {
			this.setData({ dateFilter: options.date });
		}
		this.loadList();
	},

	onPullDownRefresh() {
		this.setData({ page: 1, hasMore: true });
		this.loadList();
	},

	onSearchInput(e) {
		this.setData({ keyword: e.detail.value });
	},

	onSearch() {
		this.setData({ page: 1, hasMore: true });
		this.loadList();
	},

	onFilter(e) {
		const status = Number(e.currentTarget.dataset.status);
		this.setData({ currentStatus: status, page: 1, hasMore: true });
		this.loadList();
	},

	async loadList() {
		if (this.data.loading) return;
		this.setData({ loading: true });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'admin/visitorList',
					page: this.data.page,
					size: 20,
					keyword: this.data.keyword,
					status: this.data.currentStatus === -1 ? '' : this.data.currentStatus
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
			console.error('加载失败:', err);
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

	goDetail(e) {
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: `/pages/visitor/detail/detail?id=${id}` });
	}
});
