import { MdField, MdButton } from "vue-material/dist/components";
import 'vue-material/dist/theme/default.css'
import 'vue-material/dist/vue-material.min.css'

export default ({ Vue, router }) => {
  Vue.use(MdField);
  Vue.use(MdButton);

  router.beforeEach((to, from, next) => {
    if (/^\/api/.test(to.fullPath)) {
      window.location.href  = `${to.path}.html${to.hash}`;
      next(false);
    } else {
      next();
    }
  });
};
