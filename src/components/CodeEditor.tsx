// src/components/CodeEditor.tsx
import React from "react";
import Editor from "@monaco-editor/react";

const CodeEditor: React.FC = () => {
  const defaultCode = `// Escribí tu algoritmo acá
mientras (condicion) hacer
  // instrucciones
finMientras`;

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-xl">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue={defaultCode}
        theme="vs-dark"
        options={{
          fontSize: 16,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: {
            enabled: true,
            scale: 1,
          },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          roundedSelection: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: true,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          automaticLayout: true,
          wordWrap: "on",
          padding: {
            top: 10,
            bottom: 10,
          },
          suggest: {
            preview: true,
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;
