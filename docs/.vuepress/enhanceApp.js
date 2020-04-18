import { MdField, MdButton } from "vue-material/dist/components";
import 'vue-material/dist/theme/default.css'
import 'vue-material/dist/vue-material.min.css'

export default ({ Vue }) => {
  Vue.use(MdField);
  Vue.use(MdButton);
};
