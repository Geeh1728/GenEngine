'use client';

import React from 'react';
import { Lock, CheckCircle2, Play, BookOpen, FlaskConical, Box, Settings } from 'lucide-react';
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
      case 'VOX': return <BookOpen className="w-5 h-5" />;
      case 'ASM': return <Settings className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 py-12 w-full max-w-4xl mx-auto">
      {orderedNodes.map((node, index) => {
        const isCompleted = completedNodeIds.includes(node.id);
        const isLocked = index > 0 && !completedNodeIds.includes(orderedNodes[index - 1].id);
        
        return (
          <div key={node.id} className="relative flex flex-col items-center w-full">
            {/* Connection Line */}
            {index < orderedNodes.length - 1 && (
              <div className="absolute top-20 w-1 h-24 -z-10 bg-slate-800">
                {isCompleted && (
                  <div className="w-full h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                )}
              </div>
            )}

            <button
              onClick={() => !isLocked && onNodeClick(node)}
              className={`
                group relative flex items-center gap-6 p-6 rounded-3xl border-2 transition-all w-full
                ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100' : 
                  isLocked ? 'bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed opacity-50' : 
                  'bg-blue-600/10 border-blue-500/50 text-blue-100 hover:bg-blue-600/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]'}
              `}
            >
              {/* Icon / Status */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
                ${isCompleted ? 'bg-emerald-500 text-black' : 
                  isLocked ? 'bg-slate-800 text-slate-600' : 
                  'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]'}
              `}>
                {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : isLocked ? <Lock className="w-8 h-8" /> : getIcon(node.engineMode)}
              </div>

              {/* Text */}
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    {node.type} {node.engineMode && `// ${node.engineMode}`}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{node.label}</h3>
                <p className="text-sm opacity-60 line-clamp-2">{node.description}</p>
              </div>

              {/* Progress Indicator */}
              {!isLocked && !isCompleted && (
                <div className="ml-auto">
                    <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 text-[10px] font-bold uppercase tracking-tighter">
                        Start Module
                    </div>
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}