"use client";

import { useEffect, useState } from "react";
import { Wallet, ShieldAlert, TrendingDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RollingNumber } from "./RollingNumber";

export function RiskCalculator() {
    const [totalCapital, setTotalCapital] = useState("");
    const [riskPercent, setRiskPercent] = useState("0.5");
    const [stopLossPercent, setStopLossPercent] = useState("2.0");
    const [maxLeverage, setMaxLeverage] = useState(100);
    const [isSaved, setIsSaved] = useState(false);

    // Proportion Modal States
    const [showProportionModal, setShowProportionModal] = useState(false);
    const [tempProportion, setTempProportion] = useState(25);
    const [maxProportion, setMaxProportion] = useState(25);

    useEffect(() => {
        const savedCapital = localStorage.getItem("risk_capital");
        if (savedCapital) setTotalCapital(savedCapital);
        
        const savedRisk = localStorage.getItem("risk_percent");
        if (savedRisk) setRiskPercent(savedRisk);
        
        const savedSL = localStorage.getItem("risk_sl");
        if (savedSL) setStopLossPercent(savedSL);
        
        const savedLev = localStorage.getItem("risk_lev");
        if (savedLev) setMaxLeverage(parseInt(savedLev));
        
        const savedProp = localStorage.getItem("risk_prop");
        if (savedProp) setMaxProportion(parseInt(savedProp));
    }, []);

    const handleSaveCapital = () => {
        if (totalCapital && !isNaN(parseFloat(totalCapital))) {
            localStorage.setItem("risk_capital", totalCapital);
            localStorage.setItem("risk_percent", riskPercent);
            localStorage.setItem("risk_sl", stopLossPercent);
            localStorage.setItem("risk_lev", maxLeverage.toString());
            localStorage.setItem("risk_prop", maxProportion.toString());
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    const handleSaveProportion = () => {
        setMaxProportion(tempProportion);
        setShowProportionModal(false);
    };

    const capital = parseFloat(totalCapital) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const sl = parseFloat(stopLossPercent) || 0;

    let exactLeverage = 1;
    let roundedLeverage = 1;
    let actualPositionSize = 0;
    let requiredMargin = 0;
    let actualRiskPercent = 0;
    let targetProportion = 0;
    let targetPositionSize = 0;
    let sizeDiff = 0;
    let hitProportionLimit = false;

    if (capital > 0 && risk > 0 && sl > 0) {
        const exactRiskAmount = capital * (risk / 100);

        // 절대 깨지지 않는 목표 포지션 (리스크와 손절로 완벽히 고정)
        let exactPositionSize = exactRiskAmount / (sl / 100);
        
        // 유저가 설정한 증거금 한도 (Max Margin)
        const maxAllowedMargin = capital * (maxProportion / 100);

        // 증거금을 최대한 타겟 한도(예: 25%)에 부풀려서 꽉 채우기 위한 '최소 레버리지'
        const minReqLeverage = exactPositionSize / maxAllowedMargin;
        
        // 특별한 하한선(최소 1x) 외에는 무조건 증거금 타겟에 맞춤!
        let calcLeverage = Math.max(1, minReqLeverage);

        // Max Leverage 설정으로 레버리지 캡 씌우기
        roundedLeverage = Math.min(maxLeverage, Math.max(1, Math.round(calcLeverage)));

        // 레버리지가 적용된 1차 증거금
        requiredMargin = exactPositionSize / roundedLeverage;

        // 만약 맥스 레버리지를 썼는데도 증거금 한도를 초과하면? -> 포지션 깎아야함 (극단적 예외 케이스)
        if (requiredMargin > maxAllowedMargin) {
            requiredMargin = maxAllowedMargin;
            exactPositionSize = requiredMargin * roundedLeverage;
            hitProportionLimit = true;
        }

        // 증거금은 정수로 환산
        requiredMargin = Math.round(requiredMargin);
        if (requiredMargin < 1) requiredMargin = 1;

        // 최종 포지션
        actualPositionSize = requiredMargin * roundedLeverage;
        
        // 최종 실질 확정 손실률 (실제 잃는 돈)
        const actualLossAmount = actualPositionSize * (sl / 100);
        actualRiskPercent = (actualLossAmount / capital) * 100;

        targetPositionSize = actualPositionSize;
        targetProportion = (targetPositionSize / capital) * 100;
        sizeDiff = (exactRiskAmount / (sl / 100)) - actualPositionSize;
    }

    const formatNumber = (val: number, decimals: number = 2) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);

    return (
        <div className="w-full max-w-xl xl:max-w-6xl mx-auto flex flex-col xl:flex-row gap-6 xl:gap-8 animate-in slide-in-from-bottom-6 fade-in duration-700 xl:items-stretch">

            {/* 
        ==============================
        LEFT PANE: Inputs 
        ==============================
      */}
            <div className="flex-1 w-full flex flex-col gap-6">

                {/* 1. Total Asset Box */}
                <motion.div className="border border-white/20 bg-black p-5 md:p-6 relative group transition-all duration-300 hover:border-white/50 flex flex-col justify-center">
                    <div className="absolute top-3 right-3 text-[10px] text-white/30 font-bold uppercase tracking-widest cursor-default font-mono">CAPITAL_SET</div>

                    <div className="relative z-10 w-full">
                        <label className="flex items-center gap-2 text-xs md:text-sm text-gray-300 mb-3 xl:mb-5 font-bold tracking-widest cursor-default">
                            <Wallet className="w-4 h-4 xl:w-5 xl:h-5" />
                            총 자산 (USDT)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <div className="flex flex-1 items-center bg-black border border-white/20 transition-all focus-within:border-white h-[48px] xl:h-[56px] px-4 group-hover:border-white/40">
                                <span className="text-white/40 text-[15px] xl:text-lg font-bold mr-2 translate-y-[1px] leading-none">$</span>
                                <input
                                    type="number"
                                    value={totalCapital}
                                    onChange={(e) => setTotalCapital(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-transparent text-[15px] xl:text-lg font-bold focus:outline-none placeholder:text-gray-800 translate-y-[1px] m-0 p-0 leading-none"
                                />
                            </div>
                            <button
                                onClick={handleSaveCapital}
                                className={`min-w-[100px] xl:min-w-[120px] h-[48px] xl:h-[56px] font-bold text-sm tracking-widest transition-all flex items-center justify-center border ${isSaved
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-white hover:bg-white hover:text-black border-white/20 hover:border-white'
                                    }`}
                            >
                                {isSaved ? 'SAVED' : 'SAVE ALL'}
                            </button>
                        </div>

                        {/* Helper Text */}
                        <p className="hidden xl:block text-[11px] xl:text-xs text-gray-500 font-medium leading-relaxed mt-4 xl:mt-5 break-keep">
                            시스템이 최적화 포지션을 산출하는 기준이 되는 전체 시드 금액(USDT)을 입력해 주세요.
                        </p>
                    </div>
                </motion.div>

                {/* 1.5. Max Leverage Slider */}
                <motion.div className="border border-white/20 bg-black p-5 md:p-6 relative group transition-all duration-300 hover:border-white/50 flex flex-col justify-center">
                    <div className="absolute top-3 right-3 text-[10px] text-white/30 font-bold uppercase tracking-widest cursor-default font-mono">LEVERAGE_MAX</div>

                    <div className="flex items-center justify-between mb-4 xl:mb-5 relative z-10">
                        <label className="flex items-center gap-2 text-xs md:text-sm text-gray-300 font-bold tracking-widest cursor-default">
                            최대 가능 레버리지 제한
                        </label>
                        <div className="text-white font-bold font-mono tracking-widest text-lg md:text-xl flex items-baseline">
                            {maxLeverage}<span className="text-gray-500 text-sm ml-1 translate-y-[-1px]">x</span>
                        </div>
                    </div>

                    <div className="relative z-10 w-full mt-2">
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={maxLeverage}
                            onChange={(e) => setMaxLeverage(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-none appearance-none cursor-pointer outline-none hover:bg-white/40 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
                        />
                        <div className="flex justify-between mt-3 text-[10px] text-gray-600 font-bold font-mono uppercase tracking-widest">
                            <span>1x</span>
                            <span>100x</span>
                        </div>
                    </div>

                    <p className="hidden xl:block text-[11px] xl:text-xs text-gray-500 font-medium leading-relaxed mt-4 xl:mt-5 break-keep z-10 relative">
                        코인 종류에 따라 지원하는 최대 레버리지가 다릅니다. 이 값을 넘지 않도록 포지션을 제어합니다.
                    </p>
                </motion.div>

                {/* 2. Parameters Grid Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6 xl:flex-1">
                    {/* Risk % */}
                    <motion.div className="border border-white/20 bg-black p-5 relative transition-all duration-300 hover:border-white/50 flex flex-col justify-center">
                        <div className="w-full">
                            <label className="flex items-center gap-2 text-xs md:text-sm text-gray-300 mb-3 xl:mb-5 font-bold tracking-widest cursor-default">
                                <ShieldAlert className="w-4 h-4 xl:w-5 xl:h-5" />
                                허용 리스크 (1회 트레이드)
                            </label>
                            <div className="flex items-center bg-black border border-white/20 transition-all focus-within:border-white h-[48px] xl:h-[56px] px-4 group-hover:border-white/40">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={riskPercent}
                                    onChange={(e) => setRiskPercent(e.target.value)}
                                    className="w-full bg-transparent text-[15px] xl:text-lg font-bold focus:outline-none text-left xl:text-right translate-y-[1px] m-0 p-0 leading-none"
                                />
                                <span className="text-gray-500 font-bold text-[15px] xl:text-lg ml-2 translate-y-[1px] leading-none">%</span>
                            </div>
                        </div>
                        <p className="hidden xl:block text-[11px] xl:text-xs text-gray-500 font-medium leading-relaxed mt-4 xl:mt-5 break-keep">
                            1번의 트레이드 매매 당 전체 시드 대비 감수할 리스크 범위.
                        </p>
                    </motion.div>

                    {/* Stop Loss % */}
                    <motion.div className="border border-white/20 bg-black p-5 relative transition-all duration-300 hover:border-white/50 flex flex-col justify-center">
                        <div className="w-full">
                            <label className="flex items-center gap-2 text-xs md:text-sm text-gray-300 mb-3 xl:mb-5 font-bold tracking-widest cursor-default">
                                <TrendingDown className="w-4 h-4 xl:w-5 xl:h-5" />
                                차트 손절 라인
                            </label>
                            <div className="flex items-center bg-black border border-white/20 transition-all focus-within:border-white h-[48px] xl:h-[56px] px-4 group-hover:border-white/40">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={stopLossPercent}
                                    onChange={(e) => setStopLossPercent(e.target.value)}
                                    className="w-full bg-transparent text-[15px] xl:text-lg font-bold focus:outline-none text-left xl:text-right translate-y-[1px] m-0 p-0 leading-none"
                                />
                                <span className="text-gray-500 font-bold text-[15px] xl:text-lg ml-2 translate-y-[1px] leading-none">%</span>
                            </div>
                        </div>
                        <p className="hidden xl:block text-[11px] xl:text-xs text-gray-500 font-medium leading-relaxed mt-4 xl:mt-5 break-keep">
                            차트(현물) 상에서 손절이 나가는 실제 가격 하락 퍼센트.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* 
        ==============================
        RIGHT PANE: Output Board 
        ==============================
      */}
            <div className="flex-1 w-full xl:min-w-[450px]">
                <motion.div className="border-2 border-white/10 bg-black p-6 md:p-8 relative transition-all duration-300 hover:border-white/30 xl:hover:-translate-y-0.5 xl:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] h-full flex flex-col items-start xl:justify-between">
                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-white/30 font-mono">RESULT_OUT</div>

                    <div className="flex items-center gap-2 mb-6 xl:mb-0">
                        <div className="w-2 h-2 bg-white animate-pulse" />
                        <h2 className="text-sm md:text-base font-bold tracking-widest text-white">최적화 포지션 설정</h2>
                    </div>

                    <div className="flex-1 relative flex flex-col justify-start xl:justify-center w-full mt-2 xl:mt-0 xl:py-12">
                        <AnimatePresence mode="wait">
                            {capital > 0 && risk > 0 && sl > 0 ? (
                                <motion.div
                                    key="results-populated"
                                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-8 flex flex-col w-full"
                                >
                                    {/* Position Size */}
                                    <div className="flex flex-col w-full">
                                        <div className="text-gray-400 text-xs md:text-sm mb-2 font-bold tracking-widest uppercase">
                                            목표 포지션 규모 (TARGET SIZE)
                                        </div>
                                        <div className="text-4xl xl:text-5xl text-white font-bold tracking-tight flex items-end w-full mt-2">
                                            <span className="mr-2 text-2xl xl:text-3xl text-gray-400 font-normal pb-0.5 xl:pb-1">$</span>
                                            <RollingNumber value={formatNumber(actualPositionSize)} className="font-bold tracking-tight" />
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 text-[11px] md:text-xs tracking-wide">
                                            <span className="text-gray-500 font-bold cursor-default">총자산 대비 포지션 비율:</span>
                                            <span className="text-white/70 font-bold px-2 py-1 flex items-baseline gap-1">
                                                <RollingNumber value={formatNumber(targetProportion)} />
                                                <span>%</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-white/20 my-4" />

                                    {/* Split Leverages */}
                                    <div className="grid grid-cols-2 gap-4 pb-2 w-full">
                                        <div className="flex flex-col justify-start">
                                            <div className="text-gray-400 text-[10px] md:text-xs mb-2 font-bold tracking-widest uppercase">
                                                레버리지 (LEVERAGE)
                                            </div>
                                            <div className="text-2xl xl:text-4xl text-white font-bold tracking-tight flex items-start gap-1 mt-1">
                                                <RollingNumber value={roundedLeverage.toString()} className="font-bold tracking-tight leading-none" />
                                                <span className="text-sm xl:text-base text-gray-400 font-bold mt-0.5 xl:mt-1 ml-0.5">x</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-start">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="text-gray-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">
                                                    필요 증거금 (MARGIN)
                                                </div>
                                                <span
                                                    onClick={() => {
                                                        setTempProportion(maxProportion);
                                                        setShowProportionModal(true);
                                                    }}
                                                    className="text-[10px] font-bold tracking-widest cursor-pointer hover:bg-white/20 hover:text-white transition-all border border-white/30 text-white/50 px-1.5 py-0.5 rounded-sm"
                                                    title="클릭하여 증거금 진입 한도 설정"
                                                >
                                                    MAX {maxProportion}%
                                                </span>
                                            </div>
                                            <div className="text-2xl xl:text-4xl text-white font-bold tracking-tight flex items-start gap-1 mt-1">
                                                <span className="text-sm xl:text-base text-gray-400 font-bold mt-0.5 xl:mt-1 mr-0.5">$</span>
                                                <RollingNumber value={formatNumber(requiredMargin)} className="font-bold tracking-tight leading-none" />
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-2 font-medium">
                                                <span className="mr-1">진입 비중:</span>
                                                <span className="text-white font-bold">{formatNumber((requiredMargin / capital) * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="waiting-state"
                                    initial={{ opacity: 0, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500 font-bold tracking-widest text-sm cursor-default"
                                >
                                    [ 자산과 손절기준을 입력해 주세요 ]
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Notice */}
                    <div className="mt-auto xl:pt-6 w-full">
                        {capital > 0 && risk > 0 && sl > 0 && (
                            <div className="text-[11px] md:text-xs text-gray-400 leading-relaxed bg-white/5 p-4 border-l-2 border-white cursor-default w-full mt-6 xl:mt-0 flex flex-col gap-2">
                                <div>
                                    <span className="text-white font-bold">INFO: </span>
                                    {Math.abs(sizeDiff) > 0.1 ? (
                                        <>
                                            설정된 목표 비중(<span className="font-bold text-white mx-1">{formatNumber(targetProportion)}%</span>) 환산 시 이상적인 포지션 규모는 <span className="font-bold text-white mx-1">{formatNumber(targetPositionSize)} USDT</span> 이나, <br />
                                            레버리지 제한(<span className="font-bold text-white">{roundedLeverage}x</span>) 요건을 맞추기 위해 투입 증거금이 <b>{formatNumber(requiredMargin)} USDT</b>로 최적화되었습니다. 이에 따라 최종 포지션 규모가 타겟 대비 <span className="text-white font-bold">{formatNumber(Math.abs(sizeDiff))} USDT</span> 만큼 <b>{sizeDiff > 0 ? '상향' : '하향'}</b> 보정되었습니다.
                                        </>
                                    ) : (
                                        <>
                                            설정된 목표 비중 환산 시 이상적인 포지션 규모({formatNumber(targetPositionSize)} USDT)와 오차 없이 일치하는 최적화 세팅입니다. 추가적인 볼륨 스케일링이 발생하지 않았습니다.
                                        </>
                                    )}
                                </div>
                                {hitProportionLimit && (
                                    <div className="text-red-400/80">
                                        <span className="font-bold">NOTICE: </span>최대 제공 가능한 레버리지를 초과하여, '최대 증거금 진입 비율({maxProportion}%)' 제약을 맞추기 위해 불가피하게 포지션 사이즈가 하향 보정되었습니다. (실 위험 손실: {formatNumber(actualRiskPercent, 3)}%)
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {showProportionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-sm border-2 border-white bg-black p-6 md:p-8 relative shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]"
                        >
                            <button onClick={() => setShowProportionModal(false)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-sm font-bold tracking-widest text-white mb-6 uppercase">Margin Proportion Limit</h3>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-xs font-bold tracking-widest">차트 1회 당 증거금 진입 한도</span>
                                <span className="text-white font-mono font-bold text-xl">{tempProportion}%</span>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={tempProportion}
                                onChange={(e) => setTempProportion(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/20 rounded-none appearance-none cursor-pointer outline-none hover:bg-white/40 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
                            />
                            <div className="flex justify-between mt-3 text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest">
                                <span>1%</span>
                                <span>100%</span>
                            </div>

                            <p className="text-[11px] text-gray-500 leading-relaxed break-keep mt-5 mb-8">
                                다중 매매 운용을 위해, 1번의 트레이드에 <b>실제 투입되는 내 돈(증거금)</b>이 전체 시드의 특정 비율을 넘지 않도록 제한합니다. 이 비율을 맞추기 위해 자동으로 레버리지를 조절합니다.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowProportionModal(false)} className="flex-1 py-3 text-xs font-bold tracking-widest text-white/50 hover:text-white border border-white/10 hover:border-white/30 transition-all">
                                    CANCEL
                                </button>
                                <button onClick={handleSaveProportion} className="flex-1 py-3 bg-white text-black text-xs font-bold tracking-widest hover:bg-gray-200 transition-all">
                                    SAVE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
