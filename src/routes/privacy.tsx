import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — Срок" },
      {
        name: "description",
        content: "Как планер «Срок» использует и хранит данные пользователей.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper-grid">
      <header className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-bold">
          Срок<span className="text-accent">.</span>
        </Link>
        <Link
          to="/auth"
          search={{ redirect: undefined }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Войти
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        <article className="rounded-lg border border-border bg-card p-6 shadow-lift sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Последнее обновление: 17 ноября 2026 года
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Политика конфиденциальности</h1>
          <p className="mt-6 text-muted-foreground">
            Эта политика объясняет, какие данные обрабатывает планер задач «Срок», для чего они
            используются и как запросить их удаление.
          </p>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Какие данные мы получаем</h2>
            <p className="text-muted-foreground">
              Если вы входите через Google, Google передаёт нам адрес электронной почты, имя и
              фотографию профиля. Эти сведения используются для создания и защиты вашей учётной
              записи и для отображения профиля в планере. «Срок» запрашивает только базовые данные
              профиля и адрес электронной почты; мы не получаем доступ к вашим письмам, контактам,
              файлам или календарю Google.
            </p>
            <p className="text-muted-foreground">
              Планер сохраняет созданные вами данные: задачи и цели, их названия и описания, даты,
              состояние выполнения и настройки повторения. Данные привязаны к вашей учётной записи,
              чтобы вы могли пользоваться планером на разных устройствах.
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Как мы используем данные</h2>
            <p className="text-muted-foreground">
              Данные используются для входа, показа вашего профиля и работы функций планера. Данные
              Google не продаются и не используются для показа рекламы. Доступ к задачам и целям
              ограничен учётной записью пользователя.
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Хранение и обработка</h2>
            <p className="text-muted-foreground">
              Сайт размещён на Netlify. Учётные записи и данные планера обрабатываются в Lovable
              Cloud. Google используется для подтверждения входа через Google. Эти сервисы могут
              обрабатывать технические данные, необходимые для работы, защиты и доставки сайта.
              Сеанс входа хранится в браузере, чтобы не запрашивать вход при каждом открытии.
            </p>
            <p className="text-muted-foreground">
              Мы храним данные, пока существует ваша учётная запись или пока они нужны для работы
              планера. Для удаления учётной записи и связанных с ней данных напишите на
              <a className="ml-1 underline underline-offset-4" href="mailto:alexandr163@gmail.com">
                alexandr163@gmail.com
              </a>
              . Резервные копии и технические журналы могут храниться ограниченное время по правилам
              поставщиков инфраструктуры.
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Ваш выбор и вопросы</h2>
            <p className="text-muted-foreground">
              Вы можете отозвать доступ «Срока» в настройках подключённых приложений Google. После
              этого вход через Google для вашей учётной записи станет недоступен, пока вы не
              подключите его снова. По вопросам конфиденциальности или запросам на удаление данных
              обращайтесь по адресу
              <a className="ml-1 underline underline-offset-4" href="mailto:alexandr163@gmail.com">
                alexandr163@gmail.com
              </a>
              .
            </p>
          </section>
        </article>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">
            Вернуться на главную
          </Link>
        </p>
      </main>
    </div>
  );
}
