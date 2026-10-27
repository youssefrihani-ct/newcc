import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import rule from "./no-literal-ui-strings.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run("no-literal-ui-strings", rule, {
  valid: [
    { code: "const a = <button>{t('Approve claim')}</button>;" },
    { code: "const a = <input placeholder={t('Search')} />;" },
    { code: "const a = <span>{count}</span>;" },
    { code: "const a = <span>  </span>;" },
    { code: "const a = <span>—</span>;" },
    { code: "const a = <img alt={t('Logo')} />;" },
    { code: "const items = [{ label: t('Dashboard') }];" },
    { code: "const a = { type: 'button', id: 'save' };" },
    { code: "toast(t('Saved'));" },
    { code: "const a = <input type='email' className='w-full' />;" },
  ],
  invalid: [
    { code: "const a = <button>Approve claim</button>;", errors: [{ messageId: "literal" }] },
    { code: "const a = <input placeholder='Search' />;", errors: [{ messageId: "literal" }] },
    { code: "const a = <input placeholder={'Search'} />;", errors: [{ messageId: "literal" }] },
    { code: "const a = <img alt='Company logo' />;", errors: [{ messageId: "literal" }] },
    { code: "const a = <p>{'Hello there'}</p>;", errors: [{ messageId: "literal" }] },
    { code: "const items = [{ label: 'Dashboard' }];", errors: [{ messageId: "literal" }] },
    { code: "const a = { message: `Not allowed` };", errors: [{ messageId: "literal" }] },
    { code: "toast('Saved');", errors: [{ messageId: "literal" }] },
    { code: "toast.error('Could not save');", errors: [{ messageId: "literal" }] },
    { code: "alert('Are you sure?');", errors: [{ messageId: "literal" }] },
    { code: "const a = <p>Löschen</p>;", errors: [{ messageId: "literal" }] },
  ],
});
