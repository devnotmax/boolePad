import { LanguageSupport } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import type { CompletionResult } from "@codemirror/autocomplete";

const keywords = [
  "mientras", "hacer", "finMientras",
  "si", "entonces", "sino", "finSi",
  "para", "hasta", "finPara",
  "repetir", "hasta", "finRepetir",
  "segun", "hacer", "finSegun",
  "caso", "otro", "finCaso",
  "escribir", "leer",
  "inicio", "fin",
  "var", "const",
  "entero", "real", "caracter", "cadena", "booleano",
  "verdadero", "falso",
  "y", "o", "no"
];

const snippets = [
  {
    label: "mientras",
    apply: "mientras (condicion) hacer\n  \nfinMientras",
    type: "keyword"
  },
  {
    label: "si",
    apply: "si (condicion) entonces\n  \nfinSi",
    type: "keyword"
  },
  {
    label: "para",
    apply: "para i = 1 hasta n hacer\n  \nfinPara",
    type: "keyword"
  },
  {
    label: "repetir",
    apply: "repetir\n  \nhasta (condicion)",
    type: "keyword"
  },
  {
    label: "segun",
    apply: "segun (variable) hacer\n  caso valor:\n    \n  otro:\n    \nfinSegun",
    type: "keyword"
  }
];

function completePseudocode(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\w*/);
  if (!word) return null;

  const completions = [
    ...keywords.map(keyword => ({
      label: keyword,
      type: "keyword"
    })),
    ...snippets
  ];

  return {
    from: word.from,
    options: completions
  };
}

export function pseudocode() {
  return new LanguageSupport(
    javascript().language,
    [
      syntaxHighlighting(defaultHighlightStyle),
      javascript().language.data.of({
        autocomplete: {
          keywords
        }
      }),
      autocompletion({
        override: [completePseudocode]
      })
    ]
  );
} 