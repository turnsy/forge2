import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

export default defineSandbox({
  backend: vercel({ networkPolicy: "deny-all" }),
  async onSession({ use }) {
    // Eve sandbox session API — not React's use() hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({ networkPolicy: "deny-all" });
  },
});
