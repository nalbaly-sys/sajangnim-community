-- ==================================================
-- COMMUNITY TAXONOMY v1
-- 기존 업종/카테고리를 새 분류 체계로 정규화
-- ==================================================

update public.profiles
set business_type = case business_type
  when '꽃집' then '꽃·선물·행사'
  when '식당' then '외식업'
  when '카페' then '카페·베이커리·디저트'
  when '의류' then '의류·패션·잡화'
  when '미용' then '미용·뷰티'
  when '소매' then '소매·편의점'
  when '온라인' then '온라인판매·쇼핑몰'
  when '서비스' then '전문서비스·기술업'
  when '기타' then '기타 업종'
  else business_type
end
where business_type in ('꽃집','식당','카페','의류','미용','소매','온라인','서비스','기타');

update public.posts
set business_type = case business_type
  when '꽃집' then '꽃·선물·행사'
  when '식당' then '외식업'
  when '카페' then '카페·베이커리·디저트'
  when '의류' then '의류·패션·잡화'
  when '미용' then '미용·뷰티'
  when '소매' then '소매·편의점'
  when '온라인' then '온라인판매·쇼핑몰'
  when '서비스' then '전문서비스·기술업'
  when '기타' then '기타 업종'
  else business_type
end
where business_type in ('꽃집','식당','카페','의류','미용','소매','온라인','서비스','기타');

update public.posts
set category = case category
  when '오늘의 고충' then '장사 현실'
  when '사장님 하소연' then '장사 현실'
  when '사장님 위로' then '장사 현실'
  when '웃픈 장사썰' then '자유게시판'
  else category
end
where category in ('오늘의 고충','사장님 하소연','사장님 위로','웃픈 장사썰');
