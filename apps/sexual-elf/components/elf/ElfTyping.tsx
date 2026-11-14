export default function ElfTyping() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-cream-100 border-l-4 border-forest-500 rounded-lg w-fit">
      <span className="text-forest-600 italic font-serif text-sm">Sylvan is thinking</span>
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}
