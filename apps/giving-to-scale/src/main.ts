import "@ajustinjames/hardline-components";
import "@fontsource/jetbrains-mono/latin-400.css";
import "./style.css";

import {
  type AmountParseResult,
  type Currency,
  formatAmount,
  formatPercent,
  isCurrency,
  parseAmount,
} from "./core/amount.ts";
import { type CompareResult, compare, type Mode } from "./core/compare.ts";
import { reverseGift } from "./core/reverse.ts";
import { decodeShareFragment, encodeShareFragment } from "./core/share-link.ts";
import { renderField } from "./ui/field.ts";
import { amountInputText, currencyLabelText, fitInputWidth, modeText } from "./ui/form.ts";
import { createShareView } from "./ui/share.ts";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Giving to Scale page is missing ${selector}`);
  return element;
}

const amountForm = requireElement<HTMLFormElement>("#amount-form");
const giftInput = requireElement<HTMLInputElement>("#gift");
const fortuneInput = requireElement<HTMLInputElement>("#fortune");
const unitInput = requireElement<HTMLInputElement>("#unit");
const unitLabelText = requireElement<HTMLElement>("#unit-label-text");
const giftError = requireElement<HTMLElement>("#gift-error");
const fortuneError = requireElement<HTMLElement>("#fortune-error");
const unitError = requireElement<HTMLElement>("#unit-error");
const currencySelect = requireElement<HTMLSelectElement>("#currency");
const modeSwitch = requireElement<HTMLButtonElement>("#mode-switch");
const answerSection = requireElement<HTMLElement>("#answer");
const answerLabel = requireElement<HTMLElement>("#answer-label");
const answerAmount = requireElement<HTMLElement>("#answer-amount");
const answerSummary = requireElement<HTMLElement>("#answer-summary");
const answerMessage = requireElement<HTMLElement>("#answer-message");
const answerSwitch = requireElement<HTMLButtonElement>("#answer-switch");
const fieldSection = requireElement<HTMLElement>("#field-section");
const reverseSection = requireElement<HTMLElement>("#reverse");
const reverseInput = requireElement<HTMLInputElement>("#reverse-gift");
const reverseError = requireElement<HTMLElement>("#reverse-gift-error");
const reverseTail = requireElement<HTMLElement>("#reverse-tail");
const reverseAmount = requireElement<HTMLOutputElement>("#reverse-amount");
const shareView = createShareView({
  section: requireElement<HTMLElement>("#share"),
  button: requireElement<HTMLButtonElement>("#share-button"),
  note: requireElement<HTMLElement>("#share-note"),
  status: requireElement<HTMLElement>("#share-status"),
});

const locale = navigator.language || "en-US";
const textInputs = [giftInput, fortuneInput, unitInput, reverseInput];
let mode: Mode = "net-worth";
let currency: Currency = "USD";
/** True after the page opened from a share link; the answer area then prompts for the reader's figure. */
let openedFromLink = false;
let debounceTimer = 0;
let answerSignature = "";
let fieldSignature = "";
let removeField = () => {};

function showFieldError(input: HTMLInputElement, error: HTMLElement, message?: string): void {
  error.textContent = message ?? "";
  input.setAttribute("aria-invalid", message === undefined ? "false" : "true");
}

function updateFieldErrors(result: CompareResult): void {
  const errors =
    result.kind === "incomplete" || result.kind === "net-worth-zero" ? result.errors : {};
  showFieldError(giftInput, giftError, errors.gift);
  showFieldError(fortuneInput, fortuneError, errors.fortune);
  showFieldError(unitInput, unitError, errors.unit);
}

function renderAnswer(result: CompareResult, unit: AmountParseResult): void {
  let label = "";
  let amount = "";
  let summary = "";
  let message = "";
  let showSwitch = false;

  if (result.kind === "result" || result.kind === "small-fortune") {
    label = modeText[mode].answerLabel;
    amount = formatAmount(result.equivalent, currency, locale);
    summary = `${formatAmount(result.gift, currency, locale)} is ${formatPercent(result.share, locale)} of a ${formatAmount(result.fortune, currency, locale)} fortune.`;
  } else if (result.kind === "net-worth-zero") {
    message = result.message;
    showSwitch = true;
  } else if (openedFromLink && unit.kind === "empty" && Object.keys(result.errors).length === 0) {
    message = modeText[mode].enterUnit;
  }

  const nextSignature =
    label === "" && message === "" ? "" : JSON.stringify([label, amount, summary, message]);
  answerSection.hidden = nextSignature === "";
  // Update the live region only when the answer actually changes.
  if (nextSignature === answerSignature) return;

  answerLabel.textContent = label;
  answerAmount.textContent = amount;
  answerSummary.textContent = summary;
  answerMessage.textContent = message;
  answerLabel.hidden = label === "";
  answerAmount.hidden = amount === "";
  answerSummary.hidden = summary === "";
  answerMessage.hidden = message === "";
  answerSwitch.hidden = !showSwitch;
  answerSignature = nextSignature;
}

function renderFieldSection(result: CompareResult): void {
  if (result.kind !== "result" && result.kind !== "small-fortune") {
    fieldSection.hidden = true;
    if (fieldSignature !== "") {
      removeField();
      fieldSignature = "";
    }
    return;
  }

  const nextSignature = JSON.stringify([currency, result]);
  fieldSection.hidden = false;
  if (nextSignature === fieldSignature) return;

  removeField();
  removeField = renderField(fieldSection, result, { locale, currency });
  fieldSignature = nextSignature;
}

function renderReverse(result: CompareResult): void {
  if (result.kind !== "result" && result.kind !== "small-fortune") {
    reverseSection.hidden = true;
    return;
  }

  reverseSection.hidden = false;
  reverseTail.textContent = modeText[mode].reverseTail;
  const reverse = reverseGift(
    parseAmount(reverseInput.value, currency),
    result.fortune,
    result.unit,
  );
  showFieldError(
    reverseInput,
    reverseError,
    reverse.kind === "invalid" ? reverse.message : undefined,
  );
  const text = reverse.kind === "ok" ? formatAmount(reverse.amount, currency, locale) : "…";
  if (reverseAmount.textContent !== text) reverseAmount.textContent = text;
}

function renderShare(
  gift: AmountParseResult,
  fortune: AmountParseResult,
  result: CompareResult,
): void {
  const errors =
    result.kind === "incomplete" || result.kind === "net-worth-zero" ? result.errors : {};
  const shareable =
    gift.kind === "ok" &&
    fortune.kind === "ok" &&
    errors.gift === undefined &&
    errors.fortune === undefined;
  if (!shareable) {
    shareView.update({ visible: false });
    return;
  }
  shareView.update({
    visible: true,
    fragment: encodeShareFragment(gift.value, fortune.value, currency),
  });
}

function render(): void {
  window.clearTimeout(debounceTimer);
  const gift = parseAmount(giftInput.value, currency);
  const fortune = parseAmount(fortuneInput.value, currency);
  const unit = parseAmount(unitInput.value, currency);
  const result = compare({ gift, fortune, unit, mode });

  updateFieldErrors(result);
  renderAnswer(result, unit);
  renderFieldSection(result);
  renderReverse(result);
  renderShare(gift, fortune, result);
}

function setMode(nextMode: Mode): void {
  mode = nextMode;
  const text = modeText[mode];
  unitLabelText.textContent = text.unitLabel;
  unitInput.placeholder = text.unitPlaceholder;
  modeSwitch.textContent = text.switchTo;
  fitInputWidth(unitInput);
  render();
}

function setCurrency(nextCurrency: Currency): void {
  currency = nextCurrency;
  currencySelect.value = currency;
  for (const name of document.querySelectorAll(".currency-name")) {
    name.textContent = currencyLabelText(currency);
  }
}

/** Fill the gift, fortune, and currency from a share link; anything invalid is ignored. */
function openShareLink(): boolean {
  const shared = decodeShareFragment(window.location.hash);
  if (shared === null) return false;
  setCurrency(shared.currency);
  giftInput.value = amountInputText(shared.gift);
  fortuneInput.value = amountInputText(shared.fortune);
  for (const input of textInputs) fitInputWidth(input);
  openedFromLink = true;
  render();
  unitInput.focus();
  return true;
}

for (const input of textInputs) {
  fitInputWidth(input);
  input.addEventListener("input", () => {
    fitInputWidth(input);
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(render, 150);
  });
}

currencySelect.addEventListener("change", () => {
  if (isCurrency(currencySelect.value)) setCurrency(currencySelect.value);
  render();
});
modeSwitch.addEventListener("click", () => setMode(mode === "income" ? "net-worth" : "income"));
answerSwitch.addEventListener("click", () => {
  setMode("income");
  unitInput.focus();
});
amountForm.addEventListener("submit", (event) => event.preventDefault());
// A share link pasted into an open tab changes only the fragment.
window.addEventListener("hashchange", openShareLink);

openShareLink();
