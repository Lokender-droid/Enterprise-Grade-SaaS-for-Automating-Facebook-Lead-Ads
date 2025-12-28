import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomConditionNode = ({ data }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-orange-500 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex justify-center items-center bg-orange-100 text-xl mr-2">
                    ❓
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold text-gray-700">{data.label}</div>
                    <div className="text-xs text-gray-500">
                        {data.config?.field ? `${data.config.field} ${data.config.operator} ${data.config.value}` : 'Click to configure'}
                    </div>
                </div>
            </div>

            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-500" />

            {/* Output Handles */}
            <div className="flex justify-between mt-4">
                <div className="relative">
                    <div className="text-xs text-green-600 font-bold mb-1 ml-1">TRUE</div>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        className="w-3 h-3 bg-green-500 left-2"
                        style={{ left: '10px' }}
                    />
                </div>

                <div className="relative">
                    <div className="text-xs text-red-600 font-bold mb-1 mr-1 text-right">FALSE</div>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        className="w-3 h-3 bg-red-500 right-2"
                        style={{ left: 'auto', right: '10px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(CustomConditionNode);
