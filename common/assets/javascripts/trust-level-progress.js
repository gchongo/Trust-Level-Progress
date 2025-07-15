import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api, { I18n }) => {
  // 新增自定义路由
  api.addRoute("user.trust-level-progress", {
    path: "/u/:username/trust-level-progress"
  });

  // 页面内容渲染
  api.decorateWidget("user-summary-nav:after", helper => {
    const username = helper.attrs.model.username;
    return helper.h(
      "a",
      {
        class: "btn btn-default",
        href: `/u/${username}/trust-level-progress`
      },
      "信任等级进度"
    );
  });

  api.modifyClass("route:user-trust-level-progress", {
    model(params) {
      return ajax(`/u/${params.username}/summary.json`).then(data => {
        // 这里演示TL3的常见要求，可按需扩展
        const requirements = [
          { key: "days_visited", label: "访问次数（天）", require: 100, get: d => d.days_visited },
          { key: "topics_replied_to", label: "回复的话题", require: 10, get: d => d.topics_replied_to },
          { key: "topics_viewed", label: "浏览的话题（100天）", require: 500, get: d => d.topics_viewed },
          { key: "topics_viewed_all_time", label: "浏览的话题（所有时间）", require: 200, get: d => d.topics_viewed_all_time },
          { key: "posts_read", label: "已读帖子（100天）", require: 20000, get: d => d.posts_read },
          { key: "posts_read_all_time", label: "已读帖子（所有时间）", require: 500, get: d => d.posts_read_all_time },
          { key: "flagged_posts", label: "被举报的帖子", require: 5, get: d => d.flagged_posts, max: true },
          { key: "flags_given", label: "发起举报的用户", require: 5, get: d => d.flags_given, max: true },
          { key: "likes_given", label: "点赞", require: 30, get: d => d.likes_given },
          { key: "likes_received", label: "获赞", require: 20, get: d => d.likes_received },
          { key: "likes_received_max", label: "获赞：单日最高数量", require: 7, get: d => d.likes_received_max },
          { key: "likes_received_users", label: "获赞：点赞用户数量", require: 5, get: d => d.likes_received_users },
          { key: "suspended", label: "被禁言（6月）", require: 0, get: d => d.suspended, max: true },
          { key: "silenced", label: "被封禁（6月）", require: 0, get: d => d.silenced, max: true },
        ];

        // 模拟数据结构（你需要查阅 summary.json 的字段，可能要调整get方法）
        const stats = {
          days_visited: data.user_summary.days_visited,
          topics_replied_to: data.user_summary.topics_replied_to,
          topics_viewed: data.user_summary.topics_viewed,
          topics_viewed_all_time: data.user_summary.topics_viewed_all_time,
          posts_read: data.user_summary.posts_read,
          posts_read_all_time: data.user_summary.posts_read_all_time,
          flagged_posts: data.user_summary.flagged_posts || 0,
          flags_given: data.user_summary.flags_given || 0,
          likes_given: data.user_summary.likes_given,
          likes_received: data.user_summary.likes_received,
          likes_received_max: data.user_summary.likes_received_max || 0,
          likes_received_users: data.user_summary.likes_received_users || 0,
          suspended: data.user_summary.suspended || 0,
          silenced: data.user_summary.silenced || 0,
        };

        const table = requirements.map(r => {
          const current = r.get(stats) || 0;
          const percent = r.max
            ? current > r.require ? 100 : 100 - ((r.require - current) / r.require) * 100
            : Math.min(100, Math.round((current / r.require) * 100));
          const ok = r.max ? current <= r.require : current >= r.require;
          return {
            ...r,
            current,
            percent,
            ok
          };
        });

        return { stats, table, username: params.username };
      });
    },
    renderTemplate(controller, model) {
      // 简单HTML渲染
      const rows = model.table.map(row => `
        <tr>
          <td>${row.label}</td>
          <td>${row.current}</td>
          <td>${row.require}</td>
          <td><span style="color:${row.ok ? 'green' : 'red'}">${row.ok ? '✔️' : '❌'}</span></td>
        </tr>
      `).join("");
      const html = `
        <h2>信任级别 3 的要求</h2>
        <table class="trust-level-table">
          <tr><th>项目</th><th>当前</th><th>要求</th><th>达标</th></tr>
          ${rows}
        </table>
        <p style="margin-top:2em;">不符合信任级别 3 要求，继续加油。</p>
      `;
      document.querySelector(".contents").innerHTML = html;
    }
  });
});