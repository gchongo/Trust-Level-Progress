import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  api.onPageChange((url) => {
    // 严格只匹配用户 summary 页
    if (!/^\/u\/[^\/]+(\/summary)?$/.test(url)) return;

    // 防止多次插入
    if (document.querySelector(".trust-level-progress-li")) return;

    // 获取用户名
    const matches = location.pathname.match(/^\/u\/([^\/]+)/);
    if (!matches) return;
    const username = matches[1];

    // 等待统计区 ul 渲染出来
    function tryInsert() {
      // 只在 summary 页才有的容器
      const statsUl = document.querySelector(".top-section.stats-section ul");
      if (!statsUl) {
        setTimeout(tryInsert, 100);
        return;
      }

      // 获取数据并插入
      ajax(`/u/${username}/summary.json`).then(data => {
        const stats = data.user_summary;
        // 你可以根据实际API字段名调整
        const requirements = [
          { label: "访问天数（100天）", require: 50, current: stats.days_visited || 0 },
          { label: "回复的话题数", require: 10, current: stats.topics_replied_to || 0 },
          { label: "浏览的话题（100天）", require: 500, current: stats.topics_viewed || 0 },
          { label: "已读帖子（100天）", require: 20000, current: stats.posts_read || 0 },
          { label: "点赞数", require: 30, current: stats.likes_given || 0 },
          { label: "获赞数", require: 20, current: stats.likes_received || 0 },
          { label: "获赞用户数", require: 5, current: stats.likes_received_users || 0 }
        ];
        const allOK = requirements.every(r => r.current >= r.require);

        // 合成一行小统计HTML
        let html = `
          <div class="user-stat" style="flex-direction: column;align-items: flex-start;">
            <span class="label" style="font-weight:bold;">信任等级3进度${allOK ? ' <span style="color:#28a745;">✔️</span>' : ' <span style="color:#dc3545;">❌</span>'}</span>
            <div style="margin-top:3px;">
              ${requirements.map(r => `
                <span style="margin-right:10px;font-size:0.95em;">
                  ${r.label}：
                  <span style="font-weight:bold;">${r.current}</span> / ${r.require}
                  <span style="font-size:1.1em;color:${r.current >= r.require ? "#28a745" : "#dc3545"};">
                    ${r.current >= r.require ? "✔️" : "❌"}
                  </span>
                </span>
              `).join("<br>")}
            </div>
          </div>
        `;

        // 插入到 ul 里，作为一个新的 li
        const li = document.createElement("li");
        li.className = "trust-level-progress-li";
        li.innerHTML = html;
        statsUl.appendChild(li);
      });
    }

    tryInsert();
  });
});
