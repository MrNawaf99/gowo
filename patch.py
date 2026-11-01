import sys

with open("src/components/quiz/AiConversationActivity.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. StrictMode protection
code = code.replace(
    'const scrollRef = useRef<HTMLDivElement>(null);',
    'const scrollRef = useRef<HTMLDivElement>(null);\n  const hasStartedRef = useRef(false);'
)

code = code.replace(
    'if (turns.length === 0 && !aiIsThinking) {\n      handleTurn(true);\n    }',
    'if (turns.length === 0 && !hasStartedRef.current) {\n      hasStartedRef.current = true;\n      handleTurn(true);\n    }'
)

# 2. Typewriter Effect variables & logic
code = code.replace(
    'export default function AiConversationActivity({ activity, initialValue, onChange }: Props) {',
    'export default function AiConversationActivity({ activity, initialValue, onChange }: Props) {\n  const [revealedAiText, setRevealedAiText] = useState("");'
)

code = code.replace(
    'const playAudio = (base64Url: string) => {',
    'const playAudio = (base64Url: string, fullText: string) => {\n    setRevealedAiText("");'
)

code = code.replace(
    'audioRef.current.play().catch(e => console.error("Audio play error", e));\n      setIsPlayingAudio(true);\n      audioRef.current.onended = () => setIsPlayingAudio(false);',
    'audioRef.current.play().then(() => {\n        const intervalMs = 40;\n        let charIndex = 0;\n        const timer = setInterval(() => {\n          setRevealedAiText(fullText.slice(0, charIndex + 1));\n          charIndex++;\n          if (charIndex >= fullText.length) {\n            clearInterval(timer);\n            setRevealedAiText(fullText);\n          }\n        }, intervalMs);\n        audioRef.current!.onpause = () => clearInterval(timer);\n        audioRef.current!.onended = () => {\n          setIsPlayingAudio(false);\n          clearInterval(timer);\n          setRevealedAiText(fullText);\n        };\n      }).catch(e => console.error("Audio play error", e));\n      setIsPlayingAudio(true);'
)

code = code.replace(
    'playAudio(data.audioBase64);',
    'playAudio(data.audioBase64, data.text);'
)

# 3. HandleTurn Empty Response Fix
code = code.replace(
    'if (!isFirstTurn && studentText) {\n        setTurns(prev => [...prev, { speaker: "STUDENT", text: studentText, timestamp: Date.now() }]);\n      }',
    'if (!isFirstTurn) {\n        const textToSave = studentText || "[No response]";\n        setTurns(prev => [...prev, { speaker: "STUDENT", text: textToSave, timestamp: Date.now() }]);\n      }'
)

# 4. Typewriter rendering in JSX
code = code.replace(
    '<p className="text-sm md:text-base leading-relaxed">{turn.text}</p>',
    '<p className="text-sm md:text-base leading-relaxed">{turn.speaker === "AI" && idx === turns.length - 1 && isPlayingAudio ? revealedAiText : turn.text}</p>'
)

with open("src/components/quiz/AiConversationActivity.tsx", "w", encoding="utf-8") as f:
    f.write(code)
