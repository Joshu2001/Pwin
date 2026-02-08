$base = "https://pwin.onrender.com"
function Report($label, $value){ Write-Output ("{0}: {1}" -f $label, $value) }

try { $h = Invoke-RestMethod -Uri "$base/health" -Method GET; Report "health" ($h.status) } catch { Report "health" $_.Exception.Message }

try { $r = Invoke-RestMethod -Uri "$base/requests" -Method GET; $rc = if ($r.requests) { $r.requests.Count } else { 0 }; Report "requests.count" $rc } catch { Report "requests.count" $_.Exception.Message }

$firstRequestId = if ($r -and $r.requests -and $r.requests.Count -gt 0) { $r.requests[0].id } else { $null }
if ($firstRequestId) {
  try { $c = Invoke-RestMethod -Uri "$base/requests/$firstRequestId/comments" -Method GET; $cc = if ($c.comments) { $c.comments.Count } else { 0 }; Report "comments.count" $cc } catch { Report "comments.count" $_.Exception.Message }
} else {
  Report "comments.count" "no-requests"
}

try { $v = Invoke-RestMethod -Uri "$base/videos" -Method GET; $vc = if ($v.videos) { $v.videos.Count } else { 0 }; Report "videos.count" $vc } catch { Report "videos.count" $_.Exception.Message }

$firstVideoId = if ($v -and $v.videos -and $v.videos.Count -gt 0) { $v.videos[0].id } else { $null }
if ($firstVideoId) {
  try { Invoke-RestMethod -Uri "$base/videos/$firstVideoId" -Method GET | Out-Null; Report "video.fetch" "ok" } catch { Report "video.fetch" $_.Exception.Message }
  try { $ls = Invoke-RestMethod -Uri "$base/likes/status?videoId=$firstVideoId" -Method GET; Report "likes.status" ("liked={0},disliked={1}" -f $ls.liked, $ls.disliked) } catch { Report "likes.status" $_.Exception.Message }
} else {
  Report "video.fetch" "no-videos"
  Report "likes.status" "no-videos"
}
