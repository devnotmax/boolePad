"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  Download,
  Plus,
  Code,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { DeleteIcon } from "@/icons/DeleteIcon";

// Definición de palabras clave y snippets del pseudolenguaje
const KEYWORDS = [
  "ALGORITMO",
  "INICIO",
  "FIN",
  "VARIABLES",
  "CONSTANTES",
  "SI",
  "ENTONCES",
  "SINO",
  "FIN_SI",
  "MIENTRAS",
  "HACER",
  "FIN_MIENTRAS",
  "PARA",
  "DESDE",
  "HASTA",
  "PASO",
  "FIN_PARA",
  "REPETIR",
  "HASTA_QUE",
  "SEGUN",
  "CASO",
  "FIN_SEGUN",
  "LEER",
  "ESCRIBIR",
  "MOSTRAR",
  "VERDADERO",
  "FALSO",
  "Y",
  "O",
  "NO",
  "ENTERO",
  "REAL",
  "CARACTER",
  "CADENA",
  "LOGICO",
];

type SnippetKey = keyof typeof SNIPPETS;

const SNIPPETS = {
  si: `SI (condición) ENTONCES
    // acciones
FIN_SI`,
  sino: `SI (condición) ENTONCES
    // acciones si verdadero
SINO
    // acciones si falso
FIN_SI`,
  mientras: `MIENTRAS (condición) HACER
    // acciones
FIN_MIENTRAS`,
  para: `PARA variable DESDE inicio HASTA fin PASO incremento HACER
    // acciones
FIN_PARA`,
  repetir: `REPETIR
    // acciones
HASTA_QUE (condición)`,
  segun: `SEGUN variable HACER
    CASO valor1:
        // acciones
    CASO valor2:
        // acciones
    SINO:
        // acciones por defecto
FIN_SEGUN`,
  algoritmo: `ALGORITMO nombre_algoritmo
ENTRADAS: //todas las entradas del algoritmo
SALIDAS: //todas las salidas del algoritmo
A0 INICIALIZAR
A1 LEER()
A2 PROCESAR()
A3 ESCRIBIR()
A4 PARAR
`,
  inicializar: `// Inicialización de variables
contador <- 0
suma <- 0
max <- 0
contador_pares <- 0
contador_impares <- 0`,
  calcular_promedio: `SI (contador > 0) ENTONCES
    promedio <- suma / contador
SINO
    promedio <- 0
FIN_SI`,
  contar_pares_impares: `SI (numero % 2 = 0) ENTONCES
    contador_pares <- contador_pares + 1
SINO
    contador_impares <- contador_impares + 1
FIN_SI`,
  actualizar_maximo: `SI (numero > max) ENTONCES
    max <- numero
FIN_SI`,
  estructura_algoritmo: `ALGORITMO nombre_algoritmo
ENTRADA: numero: ENTERO
SALIDA: contador, suma, max, contador_pares, contador_impares: ENTERO, promedio: REAL

A0. INICIALIZAR
A1. LEER(numero)
A2. max <- numero
A3. RealizarCalculos
A4. SI (contador > 0) ENTONCES
    promedio <- suma / contador //calcular el promedio
  SINO
    promedio <- 0
  FIN_SI
A5. ESCRIBIR(contador, suma, max, promedio, contador_pares, contador_impares)
//mostrar los resultados
`,
};

interface RefinementLevel {
  id: number;
  name: string;
  code: string;
  description: string;
  parentId?: number;
}

const THEMES = [
  { value: "dracula", label: "Dracula" },
  { value: "monokai", label: "Monokai" },
];

const PSEUDOCODE_LANGUAGE_ID = "pseudocode";

interface PseudocodeEditorProps {
  uiTheme: "light" | "dark";
  setUiTheme: (theme: "light" | "dark") => void;
}

export default function PseudocodeEditor({
  uiTheme,
  setUiTheme,
}: PseudocodeEditorProps) {
  const { showToast } = useToast();
  const [code, setCode] = useState(`ALGORITMO nombre_algoritmo
ENTRADA: numero: ENTERO
SALIDA: contador, suma, max, contador_pares, contador_impares: ENTERO, promedio: REAL

A0. INICIALIZAR
A1. LEER(numero)
A2. max <- numero
A3. RealizarCalculos
A4. SI (contador > 0) ENTONCES
    promedio <- suma / contador //calcular el promedio
  SINO
    promedio <- 0
  FIN_SI
A5. ESCRIBIR(contador, suma, max, promedio, contador_pares, contador_impares)
//mostrar los resultados
`);

  const [formattedCode, setFormattedCode] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [refinementLevels, setRefinementLevels] = useState<RefinementLevel[]>([
    {
      id: 0,
      name: "Nivel 0 - Diseño General",
      code: "",
      description: "Descripción general del problema y solución",
    },
  ]);
  const [editingLevelName, setEditingLevelName] = useState<number | null>(null);
  const [newLevelName, setNewLevelName] = useState("");

  const [customTheme, setCustomTheme] = useState<unknown>(null);
  const [selectedTheme, setSelectedTheme] = useState("dracula");

  const monacoRef = useRef<typeof monaco | null>(null);

  useEffect(() => {
    fetch(`/themes/${selectedTheme}.json`)
      .then((res) => res.json())
      .then((data) => setCustomTheme(data));
  }, [selectedTheme]);

  useEffect(() => {
    if (customTheme && monacoRef.current) {
      monacoRef.current.editor.setTheme("user-theme");
    }
  }, [customTheme]);

  // Formatear el pseudocódigo
  const formatPseudocode = (input: string) => {
    const formatted = input;
    let indentLevel = 0;
    const lines = formatted.split("\n");

    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Reducir indentación antes de ciertas palabras clave
      if (
        trimmed.startsWith("FIN_") ||
        trimmed.startsWith("SINO") ||
        trimmed.startsWith("CASO") ||
        trimmed === "FIN"
      ) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = "    ".repeat(indentLevel) + trimmed;

      // Aumentar indentación después de ciertas palabras clave
      if (
        trimmed.includes("ENTONCES") ||
        trimmed.includes("HACER") ||
        trimmed.includes("SINO") ||
        trimmed.startsWith("CASO") ||
        trimmed === "INICIO" ||
        trimmed === "REPETIR"
      ) {
        indentLevel++;
      }

      return indentedLine;
    });

    return formattedLines.join("\n");
  };

  // Manejar autocompletado
  const handleInputChange = (value: string) => {
    setCode(value);

    // Actualizar el nivel actual
    const updatedLevels = [...refinementLevels];
    updatedLevels[currentLevel].code = value;
    setRefinementLevels(updatedLevels);

    // Formatear código
    setFormattedCode(formatPseudocode(value));
  };

  // Copiar código formateado
  const copyFormattedCode = () => {
    navigator.clipboard.writeText(formattedCode);
    showToast(
      "El pseudocódigo formateado ha sido copiado al portapapeles",
      "success"
    );
  };

  // Agregar nuevo nivel de refinamiento
  const addRefinementLevel = () => {
    const newLevel: RefinementLevel = {
      id: refinementLevels.length,
      name: `Nivel ${refinementLevels.length} - Refinamiento`,
      code: "",
      description: "Refinamiento del nivel anterior",
      parentId: currentLevel,
    };
    setRefinementLevels([...refinementLevels, newLevel]);
    setCurrentLevel(newLevel.id);
    setCode("");
    setFormattedCode("");
  };

  // Editar nombre del nivel
  const startEditingLevelName = (levelId: number) => {
    setEditingLevelName(levelId);
    setNewLevelName(refinementLevels.find((l) => l.id === levelId)?.name || "");
  };

  const saveLevelName = () => {
    if (editingLevelName !== null) {
      const updatedLevels = refinementLevels.map((level) =>
        level.id === editingLevelName ? { ...level, name: newLevelName } : level
      );
      setRefinementLevels(updatedLevels);
      setEditingLevelName(null);
    }
  };

  // Cambiar nivel de refinamiento
  const switchLevel = (levelId: number) => {
    setCurrentLevel(levelId);
    setCode(refinementLevels[levelId].code);
    setFormattedCode(formatPseudocode(refinementLevels[levelId].code));
  };

  // Descargar código
  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([formattedCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "algoritmo.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Vista previa con enlaces interactivos
  const renderFormattedCode = (formattedCode: string) => {
    // Obtener los nombres de los niveles (ignorando el nivel 0)
    const levelNames = refinementLevels
      .slice(1)
      .map((l) => l.name.split(" - ")[1]?.trim());
    // Regex para encontrar palabras que coincidan con nombres de niveles
    const regex = new RegExp(
      `\\b(${levelNames.filter(Boolean).join("|")})\\b`,
      "g"
    );
    // Dividir el código en líneas y procesar cada línea
    return formattedCode.split("\n").map((line, idx) => {
      if (!levelNames.length) return <div key={idx}>{line}</div>;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const before = line.slice(lastIndex, match.index);
        if (before) parts.push(before);
        const name = match[0];
        const levelIdx = refinementLevels.findIndex(
          (l) => l.name.split(" - ")[1]?.trim() === name
        );
        parts.push(
          <span
            key={name + idx}
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={(e) => {
              if (e.ctrlKey && levelIdx !== -1) {
                switchLevel(levelIdx);
              }
            }}
            title="Ctrl + Click para ir al nivel"
          >
            {name}
          </span>
        );
        lastIndex = match.index + name.length;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      return <div key={idx}>{parts}</div>;
    });
  };

  const handleEditorMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;
    // Registrar el lenguaje pseudocode si no existe
    if (
      !monaco.languages
        .getLanguages()
        .some((l) => l.id === PSEUDOCODE_LANGUAGE_ID)
    ) {
      monaco.languages.register({ id: PSEUDOCODE_LANGUAGE_ID });
      monaco.languages.setMonarchTokensProvider(PSEUDOCODE_LANGUAGE_ID, {
        tokenizer: {
          root: [
            // Resaltar pasos tipo A0., A1., ...
            [/\bA\d+\./, "step"],
            // Palabras clave de control
            [
              /\b(ALGORITMO|INICIO|FIN|SI|ENTONCES|SINO|FIN_SI|MIENTRAS|HACER|FIN_MIENTRAS|PARA|DESDE|HASTA|PASO|FIN_PARA|REPETIR|HASTA_QUE|SEGUN|CASO|FIN_SEGUN)\b/i,
              "keyword",
            ],
            // Tipos de datos
            [/\b(ENTERO|REAL|CARACTER|CADENA|LOGICO|BOOLEANO)\b/i, "type"],
            // Funciones de entrada/salida
            [/\b(ESCRIBIR|LEER|MOSTRAR)\b/i, "predefined"],
            // Booleanos
            [/\b(VERDADERO|FALSO)\b/i, "constant"],
            // Operadores lógicos
            [/\b(Y|O|NO)\b/i, "operator"],
            // Números
            [/\d+/, "number"],
            // Strings
            [/"[^"]*"/, "string"],
            // Comentarios
            [/\/\/.*$/, "comment"],
            // Identificadores
            [/[a-zA-Z_][a-zA-Z0-9_]*/, "identifier"],
          ],
        },
      });
    }

    if (customTheme) {
      monaco.editor.defineTheme(
        "user-theme",
        customTheme as monaco.editor.IStandaloneThemeData
      );
      monaco.editor.setTheme("user-theme");
    }

    // Autocompletado personalizado para pseudocódigo
    monaco.languages.registerCompletionItemProvider(PSEUDOCODE_LANGUAGE_ID, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = [
          ...KEYWORDS.map((keyword) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
          })),
          ...Object.keys(SNIPPETS).map((key) => ({
            label: key,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: SNIPPETS[key as SnippetKey],
            range,
          })),
        ];
        return { suggestions };
      },
      triggerCharacters: [" ", "\n"],
    });
  };

  useEffect(() => {
    if (customTheme && monacoRef.current) {
      monaco.editor.defineTheme(
        "user-theme",
        customTheme as monaco.editor.IStandaloneThemeData
      );
      monaco.editor.setTheme("user-theme");
    }
  }, [customTheme]);

  useEffect(() => {
    setFormattedCode(formatPseudocode(code));
  }, []);

  const deleteLevel = (levelId: number) => {
    if (levelId === 0) return; // No borrar el nivel 0
    const newLevels = refinementLevels.filter((l) => l.id !== levelId);
    setRefinementLevels(newLevels);
    // Si el nivel actual fue borrado, selecciona el anterior o el 0
    if (currentLevel === levelId) {
      const newIdx = Math.max(0, newLevels.length - 1);
      setCurrentLevel(newLevels[newIdx].id);
      setCode(newLevels[newIdx].code);
      setFormattedCode(formatPseudocode(newLevels[newIdx].code));
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-background`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6" />
            <h1 className="text-xl font-bold">Editor de Pseudocódigo</h1>
            <Badge variant="secondary">ECyL - Diseño de Algoritmos</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadCode}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button variant="outline" size="sm" onClick={copyFormattedCode}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            {/* Selector de tema UI */}
            <select
              value={uiTheme}
              onChange={(e) => setUiTheme(e.target.value as "light" | "dark")}
              className="bg-background text-foreground border rounded px-2 py-1 text-xs"
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Niveles de Refinamiento */}
      <div className="border-b p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm font-medium whitespace-nowrap">
            Niveles:
          </span>
          {refinementLevels.map((level) => (
            <ContextMenu.Root key={level.id}>
              <ContextMenu.Trigger asChild>
                <div className="flex items-center gap-1">
                  {editingLevelName === level.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newLevelName}
                        onChange={(e) => setNewLevelName(e.target.value)}
                        className="px-2 py-1 text-sm border rounded"
                        onBlur={saveLevelName}
                        onKeyDown={(e) => e.key === "Enter" && saveLevelName()}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Button
                      variant={
                        currentLevel === level.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => switchLevel(level.id)}
                      className="whitespace-nowrap group relative"
                    >
                      {level.name}
                    </Button>
                  )}
                  {level.parentId !== undefined && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              </ContextMenu.Trigger>
              <ContextMenu.Content className="z-50 min-w-[120px] rounded bg-popover p-1 text-xs shadow-lg border border-border">
                <ContextMenu.Item
                  onSelect={() => startEditingLevelName(level.id)}
                  className="px-2 py-1 cursor-pointer hover:bg-accent rounded"
                >
                  Editar
                </ContextMenu.Item>
                {level.id !== 0 && (
                  <ContextMenu.Item
                    onSelect={() => deleteLevel(level.id)}
                    className="px-2 py-1 cursor-pointer hover:bg-accent rounded flex items-center gap-1"
                  >
                    Eliminar
                    <DeleteIcon width={16} height={16} />
                  </ContextMenu.Item>
                )}
              </ContextMenu.Content>
            </ContextMenu.Root>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addRefinementLevel}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Nivel
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Editor - {refinementLevels[currentLevel].name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {refinementLevels[currentLevel].description}
            </p>
          </div>

          <div className="flex-1 relative">
            {/* Selector de tema */}
            <div className="absolute top-2 right-2 z-20">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-background text-foreground border rounded px-2 py-1 text-xs"
              >
                {THEMES.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
            {Boolean(customTheme) && (
              <MonacoEditor
                height="100%"
                defaultLanguage={PSEUDOCODE_LANGUAGE_ID}
                language={PSEUDOCODE_LANGUAGE_ID}
                value={code}
                theme="user-theme"
                onMount={handleEditorMount}
                onChange={(value) => handleInputChange(value || "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  fontFamily: "Fira Mono, monospace",
                }}
              />
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Vista Previa Formateada
            </h2>
          </div>

          <ScrollArea className="flex-1">
            <pre
              className="p-4 font-mono text-sm whitespace-pre-wrap bg-muted/30 min-h-full"
              style={{ fontFamily: "Fira Code, Fira Mono, monospace" }}
            >
              {renderFormattedCode(formattedCode) ||
                "El código formateado aparecerá aquí..."}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
