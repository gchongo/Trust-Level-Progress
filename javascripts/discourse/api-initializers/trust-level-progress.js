import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";
// 注意：我们不再需要从 "discourse/lib/url" 导入任何东西
import User from "discourse/models/user";

// --- 文本翻译帮助函数 ---
function getRequirementText(key, count, I18n) {
  const translations = {
    num_topics_replied_to: I18n.t("trust_levels.requirements.num_topics_replied_to", { count }),
    time_read: I18n.t("trust_levels.requirements.time_read_generic", { count }),
    posts_read: I18n.t("trust_levels.requirements.posts_read_generic", { count }),
    days_visited: I18n.t("trust_levels.requirements.days_visited", { count }),
    likes_given: I18n.t("trust_levels.requirements.likes_given", { count }),
    likes_received: I18n.t("trust_levels.requirements.likes_received", { count }),
    topics_entered: I18n.t("trust_levels.requirements.topics_entered", { count }),
    posts_read_all_time: I18n.t("trust_levels.requirements.posts_read_all_time", { count }),
    topics_replied_to_all_time: I18n.t("trust_levels.requirements.topics_replied_to_all_time", { count }),
    days_visited_tl3: I18n.t("trust_levels.requirements.days_visited_tl3", { count }),
    topics_viewed_tl3: I18n.t("trust_levels.requirements.topics_viewed_tl3_non_total", { count }),
    posts_read_tl3: I18n.t("trust_levels.requirements.posts_read_tl3_non_total", { count }),
    likes_given_tl3: I18n.t("trust_levels.requirements.likes_given_tl3", { count }),
    likes_received_tl3: I18n.t("trust_levels.requirements.likes_received_tl3", { count }),
    likes_received_users_tl3: I18n.t("trust_levels.requirements.likes_received_users_tl3", { count }),
  };
  return translations[key] || key;
}

export default apiInitializer("0.8", (api, { I18n }) => {
  // --- 注册页面路由 ---
  api.modifyClass("route:application", {
    didTransition() {
      this._super(...arguments);
      const router = this.router;
      if (!router.recognize("/u/username/trust-level-progress")) {
         router.map(function () {
           this.route("user.trust-level-progress", { path: "/u/:username/trust-level-progress" });
         });
      }
    }
  });

  // --- 定义页面数据和模板 ---
  api.modifyClass("route:user-trust-level-progress", {
    model() {
      const currentUser = this.modelFor("user");
      return ajax(`/u/${currentUser.get("username")}/summary.json`).then(
        (result) => {
          const stats = result.user_summary;
          const reqs = result.trust_level_requirements;

          const processRequirements = (levelReqs, currentStats) => {
            return Object.keys(levelReqs).map((key) => {
              const required = levelReqs[key];
              const current = currentStats[key] || 0;
              return {
                key: key,
                text: getRequirementText(key, required, I18n),
                required: required,
                current: current,
                is_met: current >= required,
              };
            });
          };

          let nextLevel = currentUser.trust_level + 1;
          if (currentUser.trust_level === 4) nextLevel = 4;

          currentUser.set("next_trust_level_display", nextLevel > 4 ? "已最高" : `${nextLevel}`);

          return {
            user: currentUser,
            stats: stats,
            requirements: {
              tl1: processRequirements(reqs.tl1, stats),
              tl2: processRequirements(reqs.tl2, stats),
              tl3: processRequirements(reqs.tl3, stats),
            },
          };
        }
      );
    },
    renderTemplate() {
      this.render("user/trust-level-progress");
    },
  });

  // --- 在用户菜单添加链接 ---
  const currentUser = api.getCurrentUser();
  if (currentUser) {
    api.addNavigationBarItem({
      name: "trust_level_progress",
      displayName: "我的升级进度",
      title: "查看我的信任等级升级进度",
      // ✅ **最终修正点**：直接拼接URL字符串，不再使用任何有问题的函数
      href: `/u/${currentUser.username_lower}/trust-level-progress`,
      forceActive: (category, args, router) => router.currentRouteName === "user.trust_level_progress",
    });
  }


  // --- 处理 /my-level 跳转 ---
  api.onPageChange((url) => {
    if (url === "/my-level") {
      const loggedInUser = api.getCurrentUser();

      if (loggedInUser) {
        const username = loggedInUser.get("username_lower");
        const finalUrl = `/u/${username}/trust-level-progress`;
        // 这里使用 require 的方式是有效的，因为它执行的是页面跳转，而非生成链接
        require("discourse/lib/url").replaceWith(finalUrl);
      } else {
        window.location.href = "/login?redirect=/my-level";
      }
    }
  });
});
