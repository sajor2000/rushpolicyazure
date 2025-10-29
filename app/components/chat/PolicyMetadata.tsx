'use client';

import React from 'react';
import { FileText, Clock, Building2, Calendar, User } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/lib/utils';

interface PolicyMetadataProps {
  policyNumber?: string;
  policyTitle?: string;
  effectiveDate?: string;
  department?: string;
  lastReviewed?: string;
  owner?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function PolicyMetadata({
  policyNumber,
  policyTitle,
  effectiveDate,
  department,
  lastReviewed,
  owner,
  className,
  variant = 'default',
}: PolicyMetadataProps) {
  const badges = [];

  if (policyNumber) {
    badges.push(
      <Badge
        key="policy-number"
        variant="rush-policy"
        className={cn('flex items-center space-x-1', variant === 'compact' && 'text-xs')}
      >
        <FileText className="w-3 h-3" />
        <span>Policy #{policyNumber}</span>
      </Badge>
    );
  }

  if (effectiveDate) {
    badges.push(
      <Badge
        key="effective-date"
        variant="outline"
        className={cn('flex items-center space-x-1', variant === 'compact' && 'text-xs')}
      >
        <Clock className="w-3 h-3" />
        <span>{effectiveDate}</span>
      </Badge>
    );
  }

  if (department) {
    badges.push(
      <Badge
        key="department"
        variant="rush-category"
        className={cn('flex items-center space-x-1', variant === 'compact' && 'text-xs')}
      >
        <Building2 className="w-3 h-3" />
        <span>{department}</span>
      </Badge>
    );
  }

  if (lastReviewed) {
    badges.push(
      <Badge
        key="last-reviewed"
        variant="secondary"
        className={cn('flex items-center space-x-1', variant === 'compact' && 'text-xs')}
      >
        <Calendar className="w-3 h-3" />
        <span>Reviewed: {lastReviewed}</span>
      </Badge>
    );
  }

  if (owner) {
    badges.push(
      <Badge
        key="owner"
        variant="secondary"
        className={cn('flex items-center space-x-1', variant === 'compact' && 'text-xs')}
      >
        <User className="w-3 h-3" />
        <span>{owner}</span>
      </Badge>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges}
      {policyTitle && variant === 'default' && (
        <div className="w-full mt-1">
          <p className="text-sm font-medium text-legacy line-clamp-2">
            {policyTitle}
          </p>
        </div>
      )}
    </div>
  );
}
