import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  api.onPageChange((url) => {
    // 只在summary页
    if (!/^\/u\/[^\/]+(\/summary)?$/.test(url)) return;

    // 防止重复插入
    if (document.querySelector(".trust-level-progress-li")) return;

    // 获取用户名
    const matches = location.pathname.match(/^\/u\/([^\/]+)/);
    if (!matches) return;
    const username = matches[1];

    // 等待ul出现
    function tryInsert() {
      const statsUl = document.querySelector(".top-section.stats-section ul");
      if (!statsUl) {
        setTimeout(tryInsert, 80);
        return;
      }
      ajax(`/u/${username}/summary.json`).then(data => {
        const stats = data.user_summary;
        // 可根据实际API调整字段
        const items = [
          { label: "访问天数（100天）", require: 50, current: stats.days_visited || 0 },
          { label: "回复的话题数", require: 10, current: stats.topics_replied_to || 0 },
          { label: "浏览的话题（100天）", require: 500, current: stats.topics_viewed || 0 },
          { label: "已读帖子（100天）", require: 20000, current: stats.posts_read || 0 },
          { label: "点赞数", require: 30, current: stats.likes_given || 0 },
          { label: "获赞数", require: 20, current: stats.likes_received || 0 },
          { label: "获赞用户数", require: 5, current: stats.likes_received_users || 0 }
        ];
        const allOK = items.every(i => i.current >= i.require);

        // 组装成一个li，样式和现有统计项一致
        const li = document.createElement("li");
        li.className = "trust-level-progress-li";
        li.innerHTML = `
          <div class="user-stat" style="flex-direction: column; align-items: flex-start;">
            <span class="label" style="font-weight:bold;">
              信任等级3进度
              <span style="font-size:1em; color:${allOK ? "#28a745" : "#dc3545"};">
                ${allOK ? "✔️" : "❌"}
              </span>
            </span>
            <div style="margin-top:3px;">
              ${items.map(i => `
                <span style="display:inline-block; min-width:180px; margin-bottom:2px;">
                  ${i.label}：
                  <span style="font-weight:bold;">${i.current}</span> / ${i.require}
                  <span style="color:${i.current >= i.require ? "#28a745" : "#dc3545"}; font-size:1.1em;">
                    ${i.current >= i.require ? "✔️" : "❌"}
                  </span>
                </span>
              `).join("<br>")}
            </div>
          </div>
        `;
        statsUl.appendChild(li);
      });
    }
    tryInsert();
  });
});
