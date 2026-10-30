/** Page-width wrapper: one content width everywhere, 20px gutters on phones. */
export default function Container({
    children,
    className = '',
    narrow = false,
}: {
    children: React.ReactNode;
    className?: string;
    /** Reading width for text-heavy pages (forms, articles). */
    narrow?: boolean;
}) {
    return (
        <div className={`mx-auto w-full px-5 sm:px-6 ${narrow ? 'max-w-3xl' : 'max-w-6xl'} ${className}`}>
            {children}
        </div>
    );
}
