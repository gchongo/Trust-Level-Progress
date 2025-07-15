import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";
import User from "discourse/models/user";

// --- 文本翻译帮助函数 (无变动) ---
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
  // --- ✅ **第一处修改**: 扩展路由表，同时注册两个新路由 ---
  api.modifyClass("route:application", {
    didTransition() {
      this._super(...arguments);
      const router = this.router;
      if (!router.recognize("/my-level")) {
         router.map(function () {
           // 注册我们实际的进度页面路由
           this.route("user.trust-level-progress", { path: "/u/:username/trust-level-progress" });
           // 注册用于跳转的入口路由
           this.route("my-level", { path: "/my-level" });
         });
      }
    }
  });

  // --- ✅ **第二处修改**: 为 /my-level 路由创建一个新的控制器来处理跳转 ---
  api.modifyClass("route:my-level", {
    // `beforeModel` 是Ember路由中用于执行跳转或检查权限的最佳位置
    beforeModel() {
      const currentUser = this.currentUser; // 在路由控制器中，可以直接用 this.currentUser 获取用户

      if (currentUser) {
        // 如果用户已登录，使用 transitionTo (内部跳转) 到目标页面
        this.transitionTo('user.trust-level-progress', currentUser.username_lower);
      } else {
        // 如果用户未登录，则重定向到登录页面
        // 登录成功后，会自动返回到 /my-level，然后此逻辑会再次运行
        window.location.href = `/login?redirect=${encodeURIComponent('/my-level')}`;
      }
    }
  });

  // --- 进度页面的数据获取逻辑 (无变动) ---
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
          return { user: currentUser, stats: stats, requirements: { tl1: processRequirements(reqs.tl1, stats), tl2: processRequirements(reqs.tl2, stats), tl3: processRequirements(reqs.tl3, stats) }};
        }
      );
    },
    renderTemplate() {
      this.render("user/trust-level-progress");
    },
  });

  // --- 在用户菜单添加链接 (无变动) ---
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

  // --- ✅ **第三处修改**: 删除无效的 onPageChange 代码块 ---
  // 原有的 api.onPageChange(...) 代码块已被完全移除。
});
