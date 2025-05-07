interface ProgressCardProps {
  status: 'mastered' | 'learning' | 'needs-practice' | 'not-started';
}

export default function ProgressCard({ status }: ProgressCardProps) {
  let badgeClasses = "text-sm font-medium px-2 py-0.5 rounded-full";
  
  switch (status) {
    case 'mastered':
      badgeClasses += " bg-green-500 text-white";
      return <span className={badgeClasses}>Mastered</span>;
      
    case 'learning':
      badgeClasses += " bg-amber-500 text-white";
      return <span className={badgeClasses}>Learning</span>;
      
    case 'needs-practice':
      badgeClasses += " bg-red-500 text-white";
      return <span className={badgeClasses}>Needs Practice</span>;
      
    case 'not-started':
      badgeClasses += " bg-neutral-300 text-neutral-700";
      return <span className={badgeClasses}>Not Started</span>;
      
    default:
      return null;
  }
}
