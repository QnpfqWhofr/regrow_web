export default function Banner() {
  return (
    <div className="w-full px-4 my-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white">
        <img
          src="https://picsum.photos/seed/krush-banner/1200/320"
          alt="배너"
          className="object-cover w-full h-48 sm:h-56 md:h-64 opacity-70"
          loading="lazy"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-6 py-6 text-left sm:px-10">
          <p className="text-xs tracking-[0.2em] uppercase text-white/80">
            Re:Grow Market
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl lg:text-4xl">
            집 근처에서 만나는
            <br className="hidden sm:block" /> 두 번째 가치
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            모바일에서도, 노트북에서도 편하게 찾아보세요.
          </p>
        </div>
      </div>
    </div>
  );
}
