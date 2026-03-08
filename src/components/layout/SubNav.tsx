interface SubNavProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  title: string;
}

export default function SubNav({ tabs, activeTab, onTabChange, title }: SubNavProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
      <h2 className="section-title mb-4">{title}</h2>
      <div className="sub-nav mb-0 inline-flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`sub-nav-item ${activeTab === tab.key ? "sub-nav-item-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
