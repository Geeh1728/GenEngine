import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, BookOpen, FlaskConical, Box, Settings, Cpu, Zap } from 'lucide-react';
import { SkillNodeSchema } from '@/lib/genkit/schemas';
import { z } from 'zod';

type SkillNode = z.infer<typeof SkillNodeSchema>;

interface SkillTreeProps {
  nodes: SkillNode[];
  recommendedPath: string[];
  completedNodeIds: string[];
  onNodeClick: (node: SkillNode) => void;
}

export default function SkillTree({ nodes, recommendedPath, completedNodeIds, onNodeClick }: SkillTreeProps) {
  // Sort nodes by recommended path order
  const orderedNodes = recommendedPath
    .map(id => nodes.find(n => n.id === id))
    .filter((n): n is SkillNode => !!n);

  const getIcon = (mode?: string) => {
    switch (mode) {
      case 'LAB': return <FlaskConical className="w-5 h-5" />;
      case 'RAP': return <Box className="w-5 h-5" />;
      case 'VOX': return <Cpu className="w-5 h-5" />;
      case 'ASM': return <Settings className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-16 py-20 w-full max-w-4xl mx-auto relative">
      {/* Background Flow Lines (Decorative) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-blue-500/0 via-blue-500 to-blue-500/0" />
      </div>

      {orderedNodes.map((node, index) => {
        const isCompleted = completedNodeIds.includes(node.id);
        const isLocked = index > 0 && !completedNodeIds.includes(orderedNodes[index - 1].id);
        const isActive = !isLocked && !isCompleted;
        
        return (
          <motion.div 
            key={node.id} 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col items-center w-full"
          >
            {/* Connection Line with Energy Flow */}
            {index < orderedNodes.length - 1 && (
              <div className="absolute top-24 w-[2px] h-32 -z-10 bg-white/5 overflow-hidden">
                {(isCompleted || isActive) && (
                  <motion.div 
                    initial={{ y: '-100%' }}
                    animate={{ y: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={`w-full h-1/2 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'} shadow-[0_0_15px_currentColor]`}
                  />
                )}
              </div>
            )}

            <motion.button
              whileHover={!isLocked ? { scale: 1.02, x: 10 } : {}}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              onClick={() => !isLocked && onNodeClick(node)}
              className={`
                group relative flex items-center gap-8 p-8 rounded-[32px] border transition-all w-full text-left overflow-hidden
                ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-100' : 
                  isLocked ? 'bg-black/20 border-white/5 text-slate-600 cursor-not-allowed grayscale' : 
                  'bg-white/5 border-blue-500/30 text-blue-100 shadow-[0_0_40px_rgba(59,130,246,0.1)]'}
              `}
            >
              {/* Holographic Background Effect */}
              {!isLocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}

              {/* Icon / Status Sphere */}
              <div className="relative shrink-0">
                <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center relative z-10
                    ${isCompleted ? 'bg-emerald-500 text-black' : 
                    isLocked ? 'bg-slate-900 border border-white/10' : 
                    'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.6)]'}
                `}>
                    {isCompleted ? <CheckCircle2 className="w-10 h-10" /> : isLocked ? <Lock className="w-8 h-8" /> : getIcon(node.engineMode)}
                </div>
                
                {isActive && (
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-blue-500/30 -z-0"
                    />
                )}
              </div>

              {/* Text Module */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400/60">
                    Neural Node: 0{index + 1} {'//'} {node.engineMode || 'GEN'}
                  </span>
                  {isActive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full border border-blue-500/30 text-[7px] font-black uppercase text-blue-400 animate-pulse">
                        <Zap className="w-2 h-2" /> Current Priority
                      </span>
                  )}
                </div>
                <h3 className="text-2xl font-black font-outfit tracking-tight mb-1">{node.label}</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xl">{node.description}</p>
              </div>

              {/* Interface Reading */}
              <div className="hidden md:flex flex-col items-end gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                  <span className="text-[7px] font-mono text-gray-500 uppercase">Estimated Integration</span>
                  <span className="text-xs font-black font-mono">{node.estimatedMinutes}m</span>
              </div>
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}