import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface FaceDetectionStats {
  totalViolations: number;
  violationTypes: {
    lookingLeft: number;
    lookingRight: number;
    faceNotDetected: number;
    multipleFaces: number;
  };
}

interface FaceDetectionDisplayProps {
  faceDetectionViolations: number;
  faceDetectionStats?: FaceDetectionStats;
}

const FaceDetectionDisplay: React.FC<FaceDetectionDisplayProps> = ({
  faceDetectionViolations,
  faceDetectionStats
}) => {
  // Check if there's a discrepancy between faceDetectionViolations and faceDetectionStats
  const hasDiscrepancy = faceDetectionViolations > 0 && 
    faceDetectionStats && 
    faceDetectionStats.totalViolations === 0;
  
  // If there's a discrepancy, we'll show the faceDetectionViolations count instead
  const effectiveViolations = hasDiscrepancy ? 
    faceDetectionViolations : 
    (faceDetectionStats?.totalViolations || 0);

  return (
    <>
      <Typography><strong>Face Detection Violations:</strong> {faceDetectionViolations || 0}</Typography>

      {faceDetectionStats && (
        <>
          <Typography sx={{ mt: 1 }}><strong>Detailed Violations:</strong></Typography>
          <Typography>
            <strong>Total Violations:</strong> {hasDiscrepancy ? 
              `${faceDetectionViolations} (reported) / ${faceDetectionStats.totalViolations} (detailed)` : 
              faceDetectionStats.totalViolations || 0}
          </Typography>
          
          {/* Show a warning if there's a discrepancy */}
          {hasDiscrepancy && (
            <Typography sx={{ color: 'warning.main', mt: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>
              Note: Detailed breakdown may be incomplete. Using total violation count for percentages.
            </Typography>
          )}
          
          <Typography sx={{ mt: 1 }}><strong>Violation Types:</strong></Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                • <strong>Looking Left:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>
                  {faceDetectionStats.violationTypes?.lookingLeft || 0}
                </Typography>
                {(faceDetectionStats.violationTypes?.lookingLeft || 0) > 0 && (
                  <Chip 
                    size="small" 
                    color="warning" 
                    label={`${Math.round((faceDetectionStats.violationTypes?.lookingLeft || 0) / (effectiveViolations || 1) * 100)}%`} 
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                • <strong>Looking Right:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>
                  {faceDetectionStats.violationTypes?.lookingRight || 0}
                </Typography>
                {(faceDetectionStats.violationTypes?.lookingRight || 0) > 0 && (
                  <Chip 
                    size="small" 
                    color="warning" 
                    label={`${Math.round((faceDetectionStats.violationTypes?.lookingRight || 0) / (effectiveViolations || 1) * 100)}%`} 
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                • <strong>Face Not Detected:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>
                  {faceDetectionStats.violationTypes?.faceNotDetected || 0}
                </Typography>
                {(faceDetectionStats.violationTypes?.faceNotDetected || 0) > 0 && (
                  <Chip 
                    size="small" 
                    color="error" 
                    label={`${Math.round((faceDetectionStats.violationTypes?.faceNotDetected || 0) / (effectiveViolations || 1) * 100)}%`} 
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                • <strong>Multiple Faces:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>
                  {faceDetectionStats.violationTypes?.multipleFaces || 0}
                </Typography>
                {(faceDetectionStats.violationTypes?.multipleFaces || 0) > 0 && (
                  <Chip 
                    size="small" 
                    color="error" 
                    label={`${Math.round((faceDetectionStats.violationTypes?.multipleFaces || 0) / (effectiveViolations || 1) * 100)}%`} 
                  />
                )}
              </Box>
            </Box>
            
            {/* If all detailed violations are 0 but we have a total count, show unclassified violations */}
            {hasDiscrepancy && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, borderTop: '1px dashed #ccc', pt: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  • <strong>Unclassified Violations:</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', mr: 1 }}>
                    {faceDetectionViolations}
                  </Typography>
                  <Chip 
                    size="small" 
                    color="primary" 
                    label="100%" 
                  />
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}
      
      {!faceDetectionStats && faceDetectionViolations > 0 && (
        <>
          <Typography sx={{ mt: 1 }}><strong>Detailed Violations:</strong></Typography>
          <Typography><strong>Total Violations:</strong> {faceDetectionViolations || 0}</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
            Detailed breakdown not available for this session
          </Typography>
        </>
      )}
    </>
  );
};

export default FaceDetectionDisplay;