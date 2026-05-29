function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary'   && 'bg-[#01696f] text-white hover:bg-[#0c4e54]',
        variant === 'secondary' && 'bg-white text-[#28251d] border border-black/12 hover:bg-[#f3f0ec]',
        variant === 'ghost'     && 'text-[#7a7974] hover:text-[#28251d] hover:bg-[#f3f0ec]',
        variant === 'danger'    && 'bg-red-50 text-red-600 hover:bg-red-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}