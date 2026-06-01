"use client";

import { useCallback, useRef, useState } from "react";
import { AuthRoleTitle } from "@/components/auth/auth-role-title";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { CardHeader } from "@/components/ui";
import { setSignupRoleCookieAction } from "@/lib/auth/form-actions";
import type { UserRole } from "@/lib/auth/types";
import { authPanelCardClass, authPanelStackClass } from "@/lib/theme";

type AuthMode = "sign-in" | "sign-up";
type SlideDirection = "forward" | "back";

function authPanelSlideClass(
  direction: SlideDirection,
  animate: boolean,
): string | undefined {
  if (!animate) {
    return undefined;
  }

  return direction === "forward"
    ? "animate-auth-panel-forward"
    : "animate-auth-panel-back";
}

function authPanelLayerClass(
  visible: boolean,
  slideClass?: string,
): string {
  return [
    slideClass,
    visible ? undefined : "invisible pointer-events-none",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AuthPanel({
  initialRole,
  initialBanner,
}: {
  initialRole: UserRole;
  initialBanner?: string | null;
}) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("forward");
  const shouldAnimate = useRef(false);

  const handleRoleChange = useCallback((nextRole: UserRole) => {
    setRole(nextRole);
    void setSignupRoleCookieAction(nextRole);
  }, []);

  const switchToSignup = useCallback(() => {
    shouldAnimate.current = true;
    setSlideDirection("forward");
    setMode("sign-up");
  }, []);

  const switchToSignIn = useCallback(() => {
    shouldAnimate.current = true;
    setSlideDirection("back");
    setMode("sign-in");
  }, []);

  const slideClass = authPanelSlideClass(slideDirection, shouldAnimate.current);
  const signInSlideClass =
    mode === "sign-in" ? authPanelLayerClass(true, slideClass) : authPanelLayerClass(false);
  const signUpSlideClass =
    mode === "sign-up" ? authPanelLayerClass(true, slideClass) : authPanelLayerClass(false);

  return (
    <div className={authPanelCardClass(mode === "sign-up" ? role : undefined)}>
      <CardHeader className={`overflow-hidden space-y-1 ${authPanelStackClass()}`}>
        <h2
          className={`text-xl font-semibold tracking-tight ${signInSlideClass}`}
          inert={mode !== "sign-in" ? true : undefined}
          aria-hidden={mode !== "sign-in"}
        >
          <div className="mb-8">Sign in</div>
        </h2>
        <h2
          className={`text-xl font-semibold tracking-tight ${signUpSlideClass}`}
          inert={mode !== "sign-up" ? true : undefined}
          aria-hidden={mode !== "sign-up"}
        >
          <AuthRoleTitle role={role} onRoleChange={handleRoleChange} />
        </h2>
      </CardHeader>

      <div className={authPanelStackClass()}>
        <div
          className={signInSlideClass}
          inert={mode !== "sign-in" ? true : undefined}
          aria-hidden={mode !== "sign-in"}
        >
          <LoginForm banner={initialBanner} onSwitchToSignup={switchToSignup} />
        </div>
        <div
          className={signUpSlideClass}
          inert={mode !== "sign-up" ? true : undefined}
          aria-hidden={mode !== "sign-up"}
        >
          <SignupForm
            active={mode === "sign-up"}
            role={role}
            onSwitchToSignIn={switchToSignIn}
          />
        </div>
      </div>
    </div>
  );
}
