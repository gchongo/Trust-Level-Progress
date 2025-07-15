import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.8", (api) => {
  // 1. 注册自定义用户页面
  api.addRoute("user.trust-level-progress", {
    path: "/u/:username/trust-level-progress"
  });

  // 2. 在用户个人页 summary 右上角加入口按钮
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

  // 3. 页面路由逻辑
  api.modifyClass("route:user-trust-level-progress", {
    model(params) {
      // 获取用户 summary 数据
      return ajax(`/u/${params.username}/summary.json`).then(data => {
        // 你可以根据实际API返回的数据字段名调整下方内容
        const stats = data.user_summary;

        // TL3条件（根据Discourse官方标准）
        const requirements = [
          {
            key: "days_visited",
            label: "访问天数（过去100天）",
            require: 50,
            current: stats.days_visited || 0,
            desc: "至少50天"
          },
          {
            key: "topics_replied_to",
            label: "回复的话题数",
            require: 10,
            current: stats.topics_replied_to || 0,
            desc: "至少10个主题"
          },
          {
            key: "topics_viewed",
            label: "浏览的话题（过去100天）",
            require: 500,
            current: stats.topics_viewed || 0,
            desc: "至少500个主题"
          },
          {
            key: "posts_read",
            label: "已读帖子（过去100天）",
            require: 20000,
            current: stats.posts_read || 0,
            desc: "至少20000条"
          },
          {
            key: "likes_given",
            label: "点赞数",
            require: 30,
            current: stats.likes_given || 0,
            desc: "至少30个"
          },
          {
            key: "likes_received",
            label: "获赞数",
            require: 20,
            current: stats.likes_received || 0,
            desc: "至少20个"
          },
          {
            key: "likes_received_users",
            label: "获赞用户数",
            require: 5,
            current: stats.likes_received_users || 0,
            desc: "至少5人"
          }
        ];

        // 非核心条件（示例，可按需补充）
        // ...如举报、被禁言、被封禁等

        return {
          stats,
          requirements,
          username: params.username
        };
      });
    },

    // 渲染到页面
    setupController(controller, model) {
      controller.setProperties(model);
    },

    renderTemplate(controller) {
      const container = document.querySelector(".contents");
      if (!container) return;

      let rows = controller.requirements.map(r => {
        const ok = r.current >= r.require;
        return `
          <tr>
            <td>${r.label}</td>
            <td>${r.current}</td>
            <td>${r.require}</td>
            <td>
              <span class="tl-progress-check ${ok ? "ok" : "fail"}">
                ${ok ? "✔️" : "❌"}
              </span>
            </td>
          </tr>
        `;
      }).join("");

      container.innerHTML = `
        <h2>信任级别 3 的要求</h2>
        <div style="margin-bottom:8px;color:#888;">在过去 100 天内（100天外数据不计）：</div>
        <table class="tl-progress-table">
          <tr>
            <th>项目</th>
            <th>当前</th>
            <th>要求</th>
            <th>达标</th>
          </tr>
          ${rows}
        </table>
        <div style="margin:1.5em 0;color:#999;">不符合信任级别 3 要求，继续加油。</div>
      `;
    }
  });
});