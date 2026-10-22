import "@ajustinjames/hardline-components";
import "@fontsource/jetbrains-mono/latin-400.css";
import "./style.css";

import { formatAmount, formatPercent, parseAmount } from "./core/amount.ts";
import { type CompareResult, compare } from "./core/compare.ts";
import { renderField } from "./ui/field.ts";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Giving to Scale page is missing ${selector}`);
  return element;
}

const giftInput = requireElement<HTMLInputElement>("#gift");
const amountForm = requireElement<HTMLFormElement>("#amount-form");
const fortuneInput = requireElement<HTMLInputElement>("#fortune");
const netWorthInput = requireElement<HTMLInputElement>("#net-worth");
const giftError = requireElement<HTMLElement>("#gift-error");
const fortuneError = requireElement<HTMLElement>("#fortune-error");
const netWorthError = requireElement<HTMLElement>("#net-worth-error");
const answerSection = requireElement<HTMLElement>("#answer");
const answerLabel = requireElement<HTMLElement>("#answer-label");
const answerAmount = requireElement<HTMLElement>("#answer-amount");
const answerSummary = requireElement<HTMLElement>("#answer-summary");
const answerMessage = requireElement<HTMLElement>("#answer-message");
const fieldSection = requireElement<HTMLElement>("#field-section");

const locale = navigator.language || "en-US";
const amountInputs = [giftInput, fortuneInput, netWorthInput];
let debounceTimer = 0;
let answerSignature = "";
let fieldSignature = "";
let removeField = () => {};

function updateFieldErrors(result: CompareResult): void {
  const errors =
    result.kind === "incomplete" || result.kind === "net-worth-zero" ? result.errors : {};
  const pairs = [
    [giftInput, giftError, errors.gift],
    [fortuneInput, fortuneError, errors.fortune],
    [netWorthInput, netWorthError, errors.netWorth],
  ] as const;

  for (const [input, error, message] of pairs) {
    error.textContent = message ?? "";
    input.setAttribute("aria-invalid", message === undefined ? "false" : "true");
  }
}

function renderAnswer(result: CompareResult): void {
  let nextSignature = "";
  let label = "";
  let amount = "";
  let summary = "";
  let message = "";

  if (result.kind === "result" || result.kind === "small-fortune") {
    label = "The same share of your net worth is";
    amount = formatAmount(result.equivalent, "USD", locale);
    summary = `${formatAmount(result.gift, "USD", locale)} is ${formatPercent(result.share, locale)} of a ${formatAmount(result.fortune, "USD", locale)} fortune.`;
    nextSignature = JSON.stringify([result.kind, label, amount, summary]);
  } else if (result.kind === "net-worth-zero") {
    message = result.message;
    nextSignature = JSON.stringify([result.kind, message]);
  }

  answerSection.hidden = nextSignature === "";
  if (nextSignature === answerSignature) return;

  answerLabel.textContent = label;
  answerAmount.textContent = amount;
  answerSummary.textContent = summary;
  answerMessage.textContent = message;
  answerLabel.hidden = label === "";
  answerAmount.hidden = amount === "";
  answerSummary.hidden = summary === "";
  answerMessage.hidden = message === "";
  answerSignature = nextSignature;
}

function resultSignature(result: CompareResult): string {
  if (result.kind === "incomplete") return "incomplete";
  if (result.kind === "net-worth-zero") return `net-worth-zero:${result.message}`;
  return JSON.stringify(result);
}

function render(): void {
  const result = compare({
    gift: parseAmount(giftInput.value),
    fortune: parseAmount(fortuneInput.value),
    netWorth: parseAmount(netWorthInput.value),
  });

  updateFieldErrors(result);
  renderAnswer(result);

  if (result.kind !== "result" && result.kind !== "small-fortune") {
    fieldSection.hidden = true;
    if (fieldSignature !== "") {
      removeField();
      fieldSignature = "";
    }
    return;
  }

  const nextSignature = resultSignature(result);
  fieldSection.hidden = false;
  if (nextSignature === fieldSignature) return;

  removeField();
  removeField = renderField(fieldSection, result, locale);
  fieldSignature = nextSignature;
}

for (const input of amountInputs) {
  input.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(render, 150);
  });
}

amountForm.addEventListener("submit", (event) => event.preventDefault());
