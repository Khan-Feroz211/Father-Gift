interface CardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
}

export default function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {header && (
        <div className="mb-4 pb-3 border-b border-navy-50">
          {typeof header === 'string' ? (
            <h3 className="font-serif text-lg text-navy-800">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      {children}
    </div>
  )
}
