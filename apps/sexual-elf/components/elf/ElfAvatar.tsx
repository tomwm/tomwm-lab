import Image from 'next/image';

export type ElfExpression = 'neutral' | 'happy' | 'concerned';

interface ElfAvatarProps {
  expression?: ElfExpression;
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function ElfAvatar({
  expression = 'neutral',
  size = 80,
  animate = false,
  className = '',
}: ElfAvatarProps) {
  return (
    <Image
      src={`/elf/elf-${expression}.svg`}
      alt={`Sylvan the elf — ${expression}`}
      width={size}
      height={size}
      style={{ width: size, height: 'auto' }}
      className={`${animate ? 'animate-elf-bob' : ''} ${className}`}
      priority
    />
  );
}
