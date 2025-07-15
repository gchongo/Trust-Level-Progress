import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";
import User from "discourse/models/user";

// --- 文本翻译帮助函数 (无变动) ---
function getRequirementText(key, count, I18n) {
  const translations = {
    num_topics_replied_to: I18n.t("trust_levels.requirements.num_topics_replied_to", { count }),
    time_read: I18n.t("trust_levels.requirements.time_read_generic", { count }),
    posts_read: I18n.t("trust_levels.requirements.posts_read_generic", { count }),
    // ... (此处省略了所有翻译键值对，与之前版本相同)
    likes_received_users_tl3: I18n.t("trust_levels.requirements.likes_received_users_tl3", { count }),
  };
  return translations[key] || key;
}

export default apiInitializer("0.8", (api, { I18n }) => {
  // ✅ **最终修正**: 使用最直接和可靠的方式注册路由
  const router = api.container.lookup("router:main");
  if (!router.hasRoute("my-level")) {
    router.map(function () {
      this.route("user.trust-level-progress", { path: "/u/:username/trust-level-progress" });
      this.route("my-level", { path: "/my-level" });
    });
  }

  // 为 /my-level 路由创建控制器以处理跳转 (无变动)
  api.modifyClass("route:my-level", {
    beforeModel() {
      const currentUser = this.currentUser;
      if (currentUser) {
        this.transitionTo('user.trust-level-progress', currentUser.username_lower);
      } else {
        window.location.href = `/login?redirect=${encodeURIComponent('/my-level')}`;
      }
    }
  });

  // 进度页面的数据获取逻辑 (无变动)
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
              return { key: key, text: getRequirementText(key, required, I18n), required, current, is_met: current >= required };
            });
          };
          let nextLevel = currentUser.trust_level + 1;
          if (currentUser.trust_level === 4) nextLevel = 4;
          currentUser.set("next_trust_level_display", nextLevel > 4 ? "已最高" : `${nextLevel}`);
          return { user: currentUser, stats, requirements: { tl1: processRequirements(reqs.tl1, stats), tl2: processRequirements(reqs.tl2, stats), tl3: processRequirements(reqs.tl3, stats) }};
        }
      );
    },
    renderTemplate() {
      this.render("user/trust-level-progress");
    },
  });

  // 在用户菜单添加链接 (无变动)
  const currentUser = api.getCurrentUser();
  if (currentUser) {
    api.addNavigationBarItem({
      name: "trust_level_progress",
      displayName: "我的升级进度",
      title: "查看我的信任等级升级进度",
      href: `/u/${currentUser.username_lower}/trust-level-progress`,
      forceActive: (category, args, router) => router.currentRouteName === "user.trust_level_progress",
    });
  }
});
