import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useServerActionForm } from "@/lib/forms/use-server-action-form";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function TestForm({
  action,
}: {
  action: (
    prev: { email: string } | null,
    formData: FormData,
  ) => Promise<{ email: string } | null>;
}) {
  const { form, onSubmit } = useServerActionForm({
    schema,
    defaultValues: { email: "", password: "" },
    action,
  });

  return (
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-2">
      <input aria-label="Email" {...form.register("email")} />
      <input
        aria-label="Password"
        type="password"
        {...form.register("password")}
      />
      <SubmitButton disabled={!form.formState.isValid}>Submit</SubmitButton>
    </Form>
  );
}

describe("useServerActionForm", () => {
  it("keeps submit disabled until the schema is satisfied", async () => {
    const action = vi.fn(async () => null);
    const user = userEvent.setup();
    render(<TestForm action={action} />);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Email"), "coach@example.com");
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Password"), "secret");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("passes validated values as FormData to the server action", async () => {
    const action = vi.fn(
      async (_prev: { email: string } | null, formData: FormData) => ({
        email: String(formData.get("email")),
      }),
    );
    const user = userEvent.setup();
    render(<TestForm action={action} />);

    await user.type(screen.getByLabelText("Email"), "coach@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });

    const formData = action.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("coach@example.com");
    expect(formData.get("password")).toBe("secret");
  });
});
