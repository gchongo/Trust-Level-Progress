import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  api.onPageChange((url) => {
    // 只在用户 summary 页面生效
    if (!/^\/u\/[^\/]+(\/summary)?$/.test(url)) return;

    // 防止多次插入
    if (document.querySelector(".tl-progress-inline")) return;

    // 从 URL 获取用户名
    const matches = location.pathname.match(/^\/u\/([^\/]+)/);
    if (!matches) return;
    const username = matches[1];

    // 获取 summary 数据
    ajax(`/u/${username}/summary.json`).then(data => {
      const stats = data.user_summary;
      // TL3条件（可自行补充）
      const requirements = [
        { key: "days_visited", label: "访问天数（100天）", require: 50, current: stats.days_visited || 0 },
        { key: "topics_replied_to", label: "回复的话题数", require: 10, current: stats.topics_replied_to || 0 },
        { key: "topics_viewed", label: "浏览的话题（100天）", require: 500, current: stats.topics_viewed || 0 },
        { key: "posts_read", label: "已读帖子（100天）", require: 20000, current: stats.posts_read || 0 },
        { key: "likes_given", label: "点赞数", require: 30, current: stats.likes_given || 0 },
        { key: "likes_received", label: "获赞数", require: 20, current: stats.likes_received || 0 },
        { key: "likes_received_users", label: "获赞用户数", require: 5, current: stats.likes_received_users || 0 }
      ];
      let rows = requirements.map(r => {
        const ok = r.current >= r.require;
        return `
          <li class="tl-progress-inline-row">
            <div class="user-stat">
              <span class="label">${r.label}</span>
              <span class="value">${r.current} / ${r.require}
                <span class="tl-progress-check" style="color:${ok ? "#28a745" : "#dc3545"};">
                  ${ok ? "✔️" : "❌"}
                </span>
              </span>
            </div>
          </li>
        `;
      }).join("");

      // 判断是否全部达标
      const allOK = requirements.every(r => r.current >= r.require);

      // 插入到 stats-section ul 后
      const statsUl = document.querySelector(".top-section.stats-section ul");
      if (statsUl) {
        const li = document.createElement("li");
        li.className = "tl-progress-inline";
        li.innerHTML = `
          <div style="margin: 0.5em 0 0.2em; font-weight: bold; color: #555;">
            信任级别 3 达标进度
            <span style="font-size: 1em; color: ${allOK ? "#28a745" : "#dc3545"};">
              ${allOK ? "（已达标 ✔️）" : "（未达标）"}
            </span>
          </div>
          <ul style="margin:0;padding-left:1.2em;">
            ${rows}
          </ul>
        `;
        statsUl.appendChild(li);
      }
    });
  });
});
