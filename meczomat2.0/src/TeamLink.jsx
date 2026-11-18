import React from 'react';
import { Link } from 'react-router-dom';
import { useTeamIndex } from './teamIndex';
import { teamPath, teamSlugFor } from './seo/shared';

// Prawdziwy link <a href="/druzyna/..."> — dzięki temu Google odkrywa podstrony drużyn.
export default function TeamLink({ name, leagueId, className, style, title, children }) {
  const idx = useTeamIndex();
  return (
    <Link to={teamPath(teamSlugFor(idx, name, leagueId))} className={`team-link${className ? ` ${className}` : ''}`} style={style} title={title}>
      {children ?? name}
    </Link>
  );
}
