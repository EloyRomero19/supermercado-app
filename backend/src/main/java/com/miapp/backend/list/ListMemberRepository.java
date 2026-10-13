package com.miapp.backend.list;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface ListMemberRepository extends JpaRepository<ListMember, ListMemberId> {

	/** Mis listas con su nº de miembros, en una sola consulta (subconsulta en el SELECT). */
	@Query("""
			select new com.miapp.backend.list.ListSummary(l.id, l.name, me.role,
				(select count(m) from ListMember m where m.list = l))
			from ListMember me join me.list l
			where me.user.id = :userId
			order by l.createdAt desc
			""")
	List<ListSummary> findSummariesByUserId(UUID userId);

	/** join fetch: trae los usuarios en la misma consulta en vez de una por miembro (problema N+1). */
	@Query("select m from ListMember m join fetch m.user where m.list.id = :listId order by m.joinedAt, m.user.displayName")
	List<ListMember> findByListIdWithUser(UUID listId);

	/** Candidato a heredar la lista: el miembro más antiguo que no sea quien se va. */
	Optional<ListMember> findFirstByIdListIdAndIdUserIdNotOrderByJoinedAt(UUID listId, UUID userId);

	/**
	 * Unirse sin errores si ya era miembro, incluso con dos peticiones simultáneas (doble clic,
	 * StrictMode): ON CONFLICT DO NOTHING lo resuelve la BD de forma atómica.
	 */
	@Modifying
	@Query(value = """
			insert into list_member (list_id, user_id, role) values (:listId, :userId, 'MEMBER')
			on conflict (list_id, user_id) do nothing
			""", nativeQuery = true)
	int insertMemberIfAbsent(UUID listId, UUID userId); // 1 si se ha unido ahora, 0 si ya era miembro

}
