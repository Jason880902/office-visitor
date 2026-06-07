// pages/visitor/list/list.js
const STATUS_TEXT = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
const STATUS_CLASS = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'visited' };

Page({
	data: {
		list: [],
		currentStatus: -1,
		page: 1,
		hasMore: true,
		loading: false
	},

	onLoad() {
		this.loadList();
	},

	onShow() {
		// 从详情页返回时刷新
		this.refreshList();
	},

	onPullDownRefresh() {
		this.refreshList();
	},

	// 刷新列表
	refreshList() {
		this.setData({ page: 1, hasMore: true });
		this.loadList();
	},

	// 加载列表
	async loadList() {
		if (this.data.loading) return;
		this.setData({ loading: true });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/myList',
					page: this.data.page,
					size: 10
				}
			});

			if (res.result.code === 0) {
				const { list, total } = res.result.data;
				const formattedList = list.map(item => ({
					...item,
					statusText: STATUS_TEXT[item.status] || '未知',
					statusClass: STATUS_CLASS[item.status] || ''
				}));

				// 根据状态筛选
				let filteredList = formattedList;
				if (this.data.currentStatus !== -1) {
					filteredList = formattedList.filter(item => item.status === this.data.currentStatus);
				}

				this.setData({
					list: this.data.page === 1 ? filteredList : [...this.data.list, ...filteredList],
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

	// 加载更多
	loadMore() {
		this.setData({ page: this.data.page + 1 });
		this.loadList();
	},

	// 状态筛选
	onFilter(e) {
		const status = Number(e.currentTarget.dataset.status);
		this.setData({ currentStatus: status, page: 1 });
		this.loadList();
	},

	// 获取通行码
	async onGetQrcode(e) {
		const id = e.currentTarget.dataset.id;

		wx.showLoading({ title: '生成中...' });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/getQrcode',
					id
				}
			});

			if (res.result.code === 0) {
				const data = res.result.data;
				if (data.fallback) {
					// 生成二维码失败，显示预约ID作为通行码
					wx.showModal({
						title: '通行码',
						content: `预约ID: ${data.visitorId}\n\n请向核验员出示此ID`,
						showCancel: false,
						confirmText: '知道了'
					});
				} else if (data.qrcodeUrl) {
					// 预览二维码
					wx.previewImage({
						urls: [data.qrcodeUrl]
					});
				}
			} else {
				wx.showToast({ title: res.result.msg || '生成失败', icon: 'none' });
			}
		} catch (err) {
			console.error('获取通行码失败:', err);
			// 显示预约ID作为备用方案
			wx.showModal({
				title: '通行码',
				content: `预约ID: ${id}\n\n请向核验员出示此ID`,
				showCancel: false,
				confirmText: '知道了'
			});
		} finally {
			wx.hideLoading();
		}
	},

	goDetail(e) {
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: `/pages/visitor/detail/detail?id=${id}` });
	},

	goApply() {
		wx.navigateTo({ url: '/pages/visitor/apply/apply' });
	}
});
