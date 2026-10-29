import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InputRequest } from "eve/client";
import { ChatInputRequest } from "./chat-input-request";
import { chatInputResponse, parseSelectionAnswer, selectionResponse } from "@/lib/chat/input-selection";

const request: InputRequest = {
  requestId: "question-1", prompt: "Assign Strength to which athletes? This replaces their current plan.", display: "select",
  options: [{ id: "jay-1", label: "Jay", description: "Current plan: Base" }, { id: "jay-2", label: "Jay (Athlete)" }],
  action: { kind: "tool-call", callId: "call-1", toolName: "ask_question", input: { selectionMode: "multiple" } },
};

describe("ChatInputRequest", () => {
  it("confirms several choices once and retains the same disabled card after completion", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    const card = screen.getByRole("region", { name: "Response needed" });
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Jay" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Jay (Athlete)" }));
    expect(onRespond).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Jay" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Jay (Athlete)" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Jay" })).toHaveAccessibleDescription("Current plan: Base");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(confirm);
    await waitFor(() => expect(onRespond).toHaveBeenCalledExactlyOnceWith(selectionResponse(request, ["jay-1", "jay-2"])));
    rerender(<ChatInputRequest request={request} disabled status="submitted" savedChoiceIds={["jay-1", "jay-2"]} onRespond={onRespond} />);
    expect(confirm).toBeDisabled();
    rerender(<ChatInputRequest request={request} disabled status="completed" savedChoiceIds={["jay-1", "jay-2"]} onRespond={onRespond} />);
    expect(screen.getByRole("region", { name: "Response summary" })).toBe(card);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(onRespond).toHaveBeenCalledOnce();
  });

  it("publishes current selections as drafts without submitting the card", () => {
    const onRespond = vi.fn();
    const onDraftChange = vi.fn();
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} onDraftChange={onDraftChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Jay" }));
    expect(parseSelectionAnswer(onDraftChange.mock.lastCall![0].text)?.selections).toEqual([{ id: "jay-1", label: "Jay" }]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Jay (Athlete)" }));
    expect(parseSelectionAnswer(onDraftChange.mock.lastCall![0].text)?.selections).toHaveLength(2);
    expect(onRespond).not.toHaveBeenCalled();
  });

  it("quietly greys a chat-resolved card and restores its draft choices", () => {
    const response = chatInputResponse(request, "Also Jane", selectionResponse(request, ["jay-1"]));
    render(<ChatInputRequest request={request} disabled={false} status="replied" savedChoiceIds={["jay-1"]} savedResponseText={response.text} onRespond={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Response summary" })).toHaveClass("opacity-75");
    expect(screen.getByRole("checkbox", { name: "Jay" })).toBeChecked();
    for (const input of screen.getAllByRole("checkbox")) expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("disables Confirm again when every checkbox is deselected", () => {
    render(<ChatInputRequest request={request} disabled={false} onRespond={vi.fn()} />);
    const candidate = screen.getByRole("checkbox", { name: "Jay" });
    fireEvent.click(candidate);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    fireEvent.click(candidate);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it.each([{ ids: [] }, { ids: ["jay-1", "jay-2"] }])("cancels without losing the selection $ids", async ({ ids }) => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    for (const id of ids) fireEvent.click(screen.getByRole("checkbox", { name: request.options!.find((option) => option.id === id)!.label }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledExactlyOnceWith(selectionResponse(request, ids, true)));
  });

  it("keeps single selection as radios and submits only the final choice", async () => {
    const single = { ...request, action: { ...request.action, input: { selectionMode: "single" } } };
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={single} disabled={false} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("radio", { name: "Jay" }));
    fireEvent.click(screen.getByRole("radio", { name: "Jay (Athlete)" }));
    expect(screen.getByRole("radio", { name: "Jay" })).not.toBeChecked();
    expect(onRespond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledExactlyOnceWith(selectionResponse(single, ["jay-2"])));
  });

  it("restores all selections disabled on a completed card", () => {
    render(<ChatInputRequest request={request} disabled={false} status="completed" savedChoiceIds={["jay-1", "jay-2"]} onRespond={vi.fn()} />);
    for (const input of screen.getAllByRole("checkbox")) {
      expect(input).toBeChecked();
      expect(input).toBeDisabled();
    }
  });

  it("allows retrying the same choices when delivery fails", async () => {
    const onRespond = vi.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValue(undefined);
    render(<ChatInputRequest request={request} disabled={false} onRespond={onRespond} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Jay" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("checkbox", { name: "Jay" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledTimes(2));
  });

  it("still supports open questions when there are no candidate options", async () => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={{ ...request, display: "text", options: undefined }} disabled={false} onRespond={onRespond} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New plan" } });
    fireEvent.click(screen.getByRole("button", { name: "Send response" }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: request.requestId, text: "New plan" }));
  });

  it.each([["Confirm", "approve"], ["Cancel", "deny"]])("preserves generic Eve confirmation support for %s", async (label, optionId) => {
    const onRespond = vi.fn().mockResolvedValue(undefined);
    render(<ChatInputRequest request={{ ...request, display: "confirmation", prompt: "Approve tool call: example" }} disabled={false} onRespond={onRespond} />);
    expect(screen.queryByText(/example/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(onRespond).toHaveBeenCalledWith({ requestId: request.requestId, optionId }));
  });
});

it("opens the shared metadata editor in chat and resumes the request without invented answers",async()=>{
  const fetchMock=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({fields:[],values:[],missing:[]}),{status:200}));
  const profile:InputRequest={...request,options:[],display:"text",action:{...request.action,input:{metadataEditor:{mode:"athlete",athleteId:"30000000-0000-4000-8000-000000000001"}}}};
  const onRespond=vi.fn().mockResolvedValue(undefined);
  const {rerender}=render(<ChatInputRequest request={profile} disabled={false} onRespond={onRespond}/>);
  await screen.findByText("No custom profile fields have been defined.");
  fireEvent.click(screen.getByRole("button",{name:"Continue"}));
  await waitFor(()=>expect(onRespond).toHaveBeenCalledExactlyOnceWith(selectionResponse(profile,[])));
  rerender(<ChatInputRequest request={profile} disabled={false} status="completed" onRespond={onRespond}/>);
  expect(screen.getByText(/Profile editor closed/)).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Save profile"})).not.toBeInTheDocument();
  fetchMock.mockRestore();
});
