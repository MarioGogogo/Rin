import { Modal } from "@rin/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "../../button";
import { Input } from "../../input";

// v2 风格搜索胶囊（带 ⌘K 提示），供 v2 header 布局使用
export function SearchPill() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isOpened, setIsOpened] = useState(false);
  const [value, setValue] = useState("");
  const label = t("article.search.title");

  const onSearch = () => {
    if (value.length === 0) return;
    setTimeout(() => setIsOpened(false), 100);
    setLocation(`/search/${encodeURIComponent(value)}`);
  };

  // 搜索值为空时按钮是"关闭"，直接关闭弹窗而非触发搜索
  const onAction = () => {
    if (value.length === 0) {
      setIsOpened(false);
      return;
    }
    onSearch();
  };

  return (
    <div className="flex flex-row items-center">
      <button
        onClick={() => setIsOpened(true)}
        title={label}
        aria-label={label}
        className="group flex items-center gap-2 rounded-full border border-black/5 bg-w px-3 py-1.5 text-xs t-secondary transition-all duration-200 hover:bg-button active:scale-90"
      >
        <i className="ri-search-line t-secondary transition-colors group-hover:text-theme" aria-hidden="true" />
        <span className="hidden sm:inline">{t("home_v2.nav.search")}</span>
        <kbd className="hidden px-1.5 py-0.5 font-mono text-[9px] t-secondary sm:inline-block">⌘K</kbd>
      </button>
      <Modal isOpen={isOpened} onRequestClose={() => setIsOpened(false)} contentLabel={label} position="top" size="sm" panelClassName="v2-pop-in p-4">
        <div className="flex w-full flex-row items-center justify-between space-x-4">
          <Input value={value} setValue={setValue} placeholder={t("article.search.placeholder")} autofocus onSubmit={onSearch} />
          <Button title={value.length === 0 ? t("close") : label} onClick={onAction} />
        </div>
      </Modal>
    </div>
  );
}
